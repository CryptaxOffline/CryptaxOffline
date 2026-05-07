export class RedemptionCounter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== "/consume" && url.pathname !== "/refund") {
      return new Response("Not found", { status: 404 });
    }

    const key = url.searchParams.get("key");
    if (!key) return new Response("Missing key", { status: 400 });

    const now = Date.now();

    // ---------
    // /consume : incrémente jusqu'à max (défaut 2)
    // ---------
    if (url.pathname === "/consume") {
      const max = Number(url.searchParams.get("max") || "2");
      const ttl = Number(url.searchParams.get("ttl") || String(24 * 3600));

      if (!Number.isFinite(max) || max < 1) {
        return new Response("Invalid max", { status: 400 });
      }
      if (!Number.isFinite(ttl) || ttl < 60) {
        return new Response("Invalid ttl", { status: 400 });
      }

      const record = (await this.state.storage.get(key)) || { count: 0, firstSeen: now };

      // TTL soft reset
      if (now - record.firstSeen > ttl * 1000) {
        record.count = 0;
        record.firstSeen = now;
      }

      if (record.count >= max) {
        return new Response(JSON.stringify({ ok: false, reason: "limit_reached", count: record.count }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      record.count += 1;
      await this.state.storage.put(key, record);

      return new Response(JSON.stringify({ ok: true, count: record.count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ---------
    // /refund : décrémente de 1 (plancher à 0)
    // Utilisé si on a consommé mais que le fichier n'a pas pu être servi.
    // ---------
    if (url.pathname === "/refund") {
      const record = (await this.state.storage.get(key)) || { count: 0, firstSeen: now };

      record.count = Math.max(0, (record.count || 0) - 1);
      await this.state.storage.put(key, record);

      return new Response(JSON.stringify({ ok: true, count: record.count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}

// ===== Configuration mise à jour =====
// Modifier ces valeurs à chaque nouvelle version :
const UPDATE_VERSION = "1.0.3";
const UPDATE_R2_WINDOWS = "CrypTax Offline_1.0.3_x64-setup.exe";
const UPDATE_R2_MAC = "CrypTax Offline_1.0.3_x64.dmg";
const UPDATE_DOWNLOAD_WINDOWS = "CrypTax_Offline_1.0.3_x64-setup.exe";
const UPDATE_DOWNLOAD_MAC = "CrypTax_Offline_1.0.3_x64.dmg";
const UPDATE_MAX_DOWNLOADS = 2;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/download") {
      const sessionId = url.searchParams.get("session_id");
      if (!sessionId) return new Response("Missing session_id", { status: 400 });

      // 0) Vérifs bindings attendus
      if (!env.DOWNLOADS_BUCKET) {
        return new Response("Server misconfigured (missing R2 binding)", { status: 500 });
      }
      if (!env.REDEMPTION_COUNTER) {
        return new Response("Server misconfigured (missing Durable Object binding)", { status: 500 });
      }

      // Stripe key (Worker Secret)
      const stripeKey = env.STRIPE_API_KEY;
      if (!stripeKey) return new Response("Server misconfigured (missing Stripe key)", { status: 500 });

      // 1) Vérif Stripe
      let session;
      try {
        const stripeRes = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } }
        );

        const stripeText = await stripeRes.text();
        if (!stripeRes.ok) {
          console.log("Stripe verification failed:", stripeRes.status);
          return new Response("Stripe verification failed", { status: 403 });
        }

        session = JSON.parse(stripeText);
      } catch (e) {
        console.log("Stripe error:", String(e));
        return new Response("Stripe verification failed", { status: 403 });
      }

      if (session.payment_status !== "paid") {
        return new Response("Payment not completed", { status: 403 });
      }

      // 1b) OS param
      const os = (url.searchParams.get("os") || "windows").toLowerCase();
      if (os !== "windows" && os !== "mac") {
        return new Response("Invalid os", { status: 400 });
      }

      // 2) Limite à 2 téléchargements (Durable Object cohérent)
      const usedKey = `used:${sessionId}`;
      const doId = env.REDEMPTION_COUNTER.idFromName(sessionId);
      const stub = env.REDEMPTION_COUNTER.get(doId);

      const ttlSeconds = 24 * 3600;
      const maxDownloads = 2;

      const consumeRes = await stub.fetch(
        `https://do/consume?key=${encodeURIComponent(usedKey)}&max=${maxDownloads}&ttl=${ttlSeconds}`
      );

      if (!consumeRes.ok) {
        return new Response("Download limit reached", { status: 403 });
      }

      // 3) R2
      const r2Key = os === "mac"
        ? UPDATE_R2_MAC
        : UPDATE_R2_WINDOWS;
      const downloadName = os === "mac"
        ? UPDATE_DOWNLOAD_MAC
        : UPDATE_DOWNLOAD_WINDOWS;

      const object = await env.DOWNLOADS_BUCKET.get(r2Key);

      if (!object) {
        // Refund 1 "slot" si le fichier n'existe pas
        await stub.fetch(`https://do/refund?key=${encodeURIComponent(usedKey)}`);
        return new Response("File not found", { status: 404 });
      }

      return new Response(object.body, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${downloadName}"`,
        },
      });
    }

    // ---- /update : téléchargement de mise à jour via payment_intent ----
    if (url.pathname === "/update") {
      const paymentId = url.searchParams.get("payment_id");
      if (!paymentId) return new Response("Missing payment_id", { status: 400 });

      if (!env.DOWNLOADS_BUCKET) {
        return new Response("Server misconfigured (missing R2 binding)", { status: 500 });
      }
      if (!env.REDEMPTION_COUNTER) {
        return new Response("Server misconfigured (missing Durable Object binding)", { status: 500 });
      }

      const stripeKey = env.STRIPE_API_KEY;
      if (!stripeKey) return new Response("Server misconfigured (missing Stripe key)", { status: 500 });

      // 1) Vérifier le payment_intent via Stripe
      let valid = false;
      try {
        const stripeRes = await fetch(
          `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentId)}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } }
        );

        if (stripeRes.ok) {
          const pi = JSON.parse(await stripeRes.text());
          if (pi.status === "succeeded") {
            valid = true;
          }
        }
      } catch (e) {
        // Stripe call failed
      }

      if (!valid) {
        return new Response("Invalid or unpaid licence key", { status: 403 });
      }

      // 2) OS param
      const os = (url.searchParams.get("os") || "windows").toLowerCase();
      if (os !== "windows" && os !== "mac") {
        return new Response("Invalid os", { status: 400 });
      }

      // 3) Limite de téléchargements par version (Durable Object)
      const usedKey = `update:${paymentId}:${UPDATE_VERSION}`;
      const doId = env.REDEMPTION_COUNTER.idFromName(paymentId);
      const stub = env.REDEMPTION_COUNTER.get(doId);

      const consumeRes = await stub.fetch(
        `https://do/consume?key=${encodeURIComponent(usedKey)}&max=${UPDATE_MAX_DOWNLOADS}&ttl=${365 * 24 * 3600}`
      );

      if (!consumeRes.ok) {
        return new Response("Download limit reached for this version", { status: 403 });
      }

      // 4) Servir le fichier depuis R2
      const r2Key = os === "mac" ? UPDATE_R2_MAC : UPDATE_R2_WINDOWS;
      const downloadName = os === "mac" ? UPDATE_DOWNLOAD_MAC : UPDATE_DOWNLOAD_WINDOWS;

      const object = await env.DOWNLOADS_BUCKET.get(r2Key);

      if (!object) {
        await stub.fetch(`https://do/refund?key=${encodeURIComponent(usedKey)}`);
        return new Response("File not found", { status: 404 });
      }

      return new Response(object.body, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${downloadName}"`,
        },
      });
    }

    // ---- /verify-update : vérifie la clé sans consommer de slot ----
    if (url.pathname === "/verify-update") {
      const paymentId = url.searchParams.get("payment_id");
      if (!paymentId) {
        return new Response(JSON.stringify({ ok: false, reason: "missing_key" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const stripeKey = env.STRIPE_API_KEY;
      if (!stripeKey) {
        return new Response(JSON.stringify({ ok: false, reason: "server_error" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      try {
        const stripeRes = await fetch(
          `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentId)}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } }
        );

        if (!stripeRes.ok) {
          return new Response(JSON.stringify({ ok: false, reason: "invalid_key" }), {
            status: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        const pi = JSON.parse(await stripeRes.text());

        if (pi.status !== "succeeded") {
          return new Response(JSON.stringify({ ok: false, reason: "not_paid" }), {
            status: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, reason: "server_error" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    // ---- /session-info : renvoie le payment_intent pour un session_id ----
    if (url.pathname === "/session-info") {
      const sessionId = url.searchParams.get("session_id");
      if (!sessionId) return new Response("Missing session_id", { status: 400 });

      const stripeKey = env.STRIPE_API_KEY;
      if (!stripeKey) return new Response("Server misconfigured", { status: 500 });

      try {
        const stripeRes = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } }
        );

        if (!stripeRes.ok) {
          return new Response(JSON.stringify({ ok: false }), {
            status: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        const session = JSON.parse(await stripeRes.text());

        if (session.payment_status !== "paid") {
          return new Response(JSON.stringify({ ok: false }), {
            status: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        return new Response(JSON.stringify({ ok: true, payment_intent: session.payment_intent }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
