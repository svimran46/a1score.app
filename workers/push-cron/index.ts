/**
 * Cloudflare Cron Worker for a1score Push Notifications
 *
 * Runs on a configurable cron trigger (every 6 hours by default) and triggers
 * the valuation alerts dispatcher endpoint at https://a1score.app/api/notifications/cron.
 */

export interface Env {
  SITE_URL?: string;
  CRON_SECRET: string;
}

export interface ScheduledController {
  scheduledTime: number;
  cron: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export default {
  // Cron Trigger handler
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const siteUrl = env.SITE_URL || "https://a1score.app";
    const endpoint = `${siteUrl.replace(/\/+$/, "")}/api/notifications/cron`;

    console.log(`[Push Cron Worker] Executing scheduled cron at ${new Date(event.scheduledTime).toISOString()}`);

    if (!env.CRON_SECRET) {
      console.error("[Push Cron Worker] Missing CRON_SECRET environment variable. Aborting cron trigger.");
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.CRON_SECRET}`,
          "User-Agent": "a1score-push-cron/1.0",
        },
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error(
          `[Push Cron Worker] Endpoint returned HTTP ${response.status}: ${responseText.slice(0, 200)}`
        );
      } else {
        console.log(`[Push Cron Worker] Successfully triggered valuation dispatcher: ${responseText.slice(0, 200)}`);
      }
    } catch (err: any) {
      console.error(`[Push Cron Worker] Network error invoking cron endpoint:`, err);
    }
  },

  // HTTP handler (allows manual trigger or health check)
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "POST" && url.pathname === "/trigger") {
      // Validate incoming secret before triggering
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const siteUrl = env.SITE_URL || "https://a1score.app";
      const endpoint = `${siteUrl.replace(/\/+$/, "")}/api/notifications/cron`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.CRON_SECRET}`,
        },
      });

      const body = await response.text();
      return new Response(body, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "a1score push cron worker active" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
