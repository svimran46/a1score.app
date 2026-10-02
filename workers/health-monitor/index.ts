/**
 * workers/health-monitor/index.ts
 *
 * Cloudflare Worker scheduled health monitor for a1score.
 * Executes every 15 minutes via cron trigger, calls /api/health/detail with secret authentication,
 * tracks consecutive degraded/down checks, and posts alerts to Discord or Telegram when
 * a component stays degraded for 2 consecutive checks (with automated recovery notifications).
 */

export interface Env {
  HEALTH_URL?: string;
  HEALTH_SECRET?: string;
  DISCORD_WEBHOOK_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  HEALTH_STATE?: any; // Cloudflare KV namespace
}

interface ComponentHealthDetail {
  status: "ok" | "degraded" | "down";
  latencyMs: number;
  lastSuccessfulFetch: string | null;
  schemaDrift: boolean;
  message?: string;
  details?: Record<string, any>;
}

interface HealthDetailResponse {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  version: string;
  components: {
    fotmob: "ok" | "degraded" | "down";
    transfermarkt: "ok" | "degraded" | "down";
    database: "ok" | "degraded" | "down";
    cache: "ok" | "degraded" | "down";
  };
  componentsDetail: {
    fotmob: ComponentHealthDetail;
    transfermarkt: ComponentHealthDetail;
    database: ComponentHealthDetail;
    cache: ComponentHealthDetail;
  };
  timings: {
    totalMs: number;
  };
}

interface ComponentMonitorState {
  consecutiveFailures: number;
  alertSent: boolean;
  lastStatus: "ok" | "degraded" | "down";
  lastChecked: string;
}

type MonitorState = Record<string, ComponentMonitorState>;

// In-memory fallback if KV namespace is not configured
let inMemoryState: MonitorState = {};

async function loadState(env: Env): Promise<MonitorState> {
  if (env.HEALTH_STATE) {
    try {
      const data = await env.HEALTH_STATE.get("state", "json");
      if (data) return data;
    } catch (e) {
      console.warn("Failed to load state from KV, falling back to memory:", e);
    }
  }
  return { ...inMemoryState };
}

async function saveState(env: Env, state: MonitorState): Promise<void> {
  inMemoryState = { ...state };
  if (env.HEALTH_STATE) {
    try {
      await env.HEALTH_STATE.put("state", JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state to KV:", e);
    }
  }
}

/**
 * Format and post notification to Discord webhook
 */
async function sendDiscordNotification(
  webhookUrl: string,
  title: string,
  description: string,
  isRecovery: boolean,
  fields: Array<{ name: string; value: string; inline?: boolean }>
) {
  // 65280 is green (#00ff00), 16753920 is amber/orange (#ff9800), 16711680 is red (#ff0000)
  const color = isRecovery ? 65280 : 16753920;

  const payload = {
    username: "a1score Health Sentinel",
    embeds: [
      {
        title: `${isRecovery ? "✅" : "⚠️"} ${title}`,
        description,
        color,
        fields,
        footer: {
          text: `a1score Sentinel • ${new Date().toISOString()}`,
        },
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to post Discord webhook:", err);
  }
}

/**
 * Format and post notification to Telegram
 */
async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  message: string
) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Failed to post Telegram notification:", err);
  }
}

/**
 * Core health check processor
 */
export async function runHealthCheck(env: Env): Promise<{
  success: boolean;
  alertsTriggered: string[];
  recoveriesTriggered: string[];
  report: any;
}> {
  const baseUrl = env.HEALTH_URL || "https://a1score.app";
  const healthEndpoint = `${baseUrl}/api/health/detail`;
  const secret = env.HEALTH_SECRET || "";

  console.log(`[Health Monitor] Probing ${healthEndpoint}...`);

  let healthData: HealthDetailResponse;
  try {
    const res = await fetch(healthEndpoint, {
      headers: {
        "x-health-secret": secret,
        "User-Agent": "a1score-Health-Monitor/1.0",
      },
    });

    if (!res.ok) {
      throw new Error(`Endpoint returned HTTP ${res.status}: ${res.statusText}`);
    }

    healthData = (await res.json()) as HealthDetailResponse;
  } catch (err: any) {
    console.error("[Health Monitor] Probe failure:", err.message || err);
    return {
      success: false,
      alertsTriggered: ["probe_fetch_failed"],
      recoveriesTriggered: [],
      report: { error: err.message || String(err) },
    };
  }

  const state = await loadState(env);
  const alertsTriggered: string[] = [];
  const recoveriesTriggered: string[] = [];

  const components = ["fotmob", "transfermarkt", "database", "cache"] as const;

  for (const comp of components) {
    const detail = healthData.componentsDetail?.[comp];
    const status = detail?.status || "down";
    const prevState: ComponentMonitorState = state[comp] || {
      consecutiveFailures: 0,
      alertSent: false,
      lastStatus: "ok",
      lastChecked: new Date().toISOString(),
    };

    if (status !== "ok") {
      prevState.consecutiveFailures += 1;
      prevState.lastStatus = status;

      console.warn(
        `[Health Monitor] Component ${comp} is ${status} (consecutive: ${prevState.consecutiveFailures})`
      );

      // Trigger alert on 2 consecutive failed/degraded checks
      if (prevState.consecutiveFailures === 2 && !prevState.alertSent) {
        prevState.alertSent = true;
        alertsTriggered.push(comp);

        const alertTitle = `Component Degradation: ${comp.toUpperCase()}`;
        const alertDesc = `Component \`${comp}\` has been **${status.toUpperCase()}** for 2 consecutive 15-minute checks (30 minutes total).`;
        const fields = [
          { name: "Component", value: comp, inline: true },
          { name: "Status", value: status.toUpperCase(), inline: true },
          { name: "Latency", value: `${detail?.latencyMs ?? "N/A"} ms`, inline: true },
          { name: "Schema Drift", value: detail?.schemaDrift ? "⚠️ DETECTED" : "None", inline: true },
          { name: "Issue Details", value: detail?.message || "Elevated response time or upstream failure." },
        ];

        if (env.DISCORD_WEBHOOK_URL) {
          await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, alertTitle, alertDesc, false, fields);
        }

        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const tgMsg = `⚠️ *a1score Alert: ${comp.toUpperCase()} Degraded*\n\nStatus: *${status.toUpperCase()}*\nDuration: 2 consecutive checks (30m)\nLatency: \`${detail?.latencyMs ?? "N/A"} ms\`\nSchema Drift: ${detail?.schemaDrift ? "YES" : "No"}\nDetails: ${detail?.message || "Check /status page for telemetry."}`;
          await sendTelegramNotification(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, tgMsg);
        }
      }
    } else {
      // Status is OK
      if (prevState.alertSent) {
        // Recovery!
        recoveriesTriggered.push(comp);

        const recTitle = `Component Recovered: ${comp.toUpperCase()}`;
        const recDesc = `Component \`${comp}\` has returned to normal **OPERATIONAL** status.`;
        const fields = [
          { name: "Component", value: comp, inline: true },
          { name: "Status", value: "OPERATIONAL", inline: true },
          { name: "Latency", value: `${detail?.latencyMs ?? "N/A"} ms`, inline: true },
        ];

        if (env.DISCORD_WEBHOOK_URL) {
          await sendDiscordNotification(env.DISCORD_WEBHOOK_URL, recTitle, recDesc, true, fields);
        }

        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const tgMsg = `✅ *a1score Recovery: ${comp.toUpperCase()} Healthy*\n\nComponent \`${comp}\` has returned to normal operations.\nLatency: \`${detail?.latencyMs ?? "N/A"} ms\``;
          await sendTelegramNotification(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, tgMsg);
        }
      }

      // Reset failure counters
      prevState.consecutiveFailures = 0;
      prevState.alertSent = false;
      prevState.lastStatus = "ok";
    }

    prevState.lastChecked = new Date().toISOString();
    state[comp] = prevState;
  }

  await saveState(env, state);

  return {
    success: true,
    alertsTriggered,
    recoveriesTriggered,
    report: healthData,
  };
}

export default {
  // Cron Trigger handler (runs every 15 minutes)
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    ctx.waitUntil(runHealthCheck(env));
  },

  // HTTP Handler for manual verification or health checks of the worker itself
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/run" || url.pathname === "/check") {
      const result = await runHealthCheck(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/state") {
      const state = await loadState(env);
      return new Response(JSON.stringify(state, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        service: "a1score-health-monitor",
        cron: "*/15 * * * *",
        endpoints: ["/run", "/state"],
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
};
