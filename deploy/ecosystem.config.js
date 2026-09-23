// pm2 process definition for LiveScore on a VPS.
//
//   npm install -g pm2
//   pm2 start deploy/ecosystem.config.js
//   pm2 save
//   pm2 startup        # follow the printed command to enable on boot
//
// The app is built with `output: "standalone"`, so the runtime needs only
// the files listed below — a bare Node binary runs server.js. See
// DEPLOYMENT.md for the full walkthrough.

module.exports = {
  apps: [
    {
      name: "livescore",
      // Standalone server entry. `PORT` is read by Next's standalone
      // server; keep HOST on the loopback interface so only Caddy can
      // reach it (Caddy terminates TLS and proxies to this port).
      script: ".next/standalone/server.js",
      args: [],
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
      // Where pm2 runs from — repo root. server.js resolves the static
      // assets relative to this, so absolute paths below are avoided.
      cwd: __dirname + "/..",

      // ---- reliability ----
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      restart_delay: 3000,

      // ---- logging ----
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-err.log",
      merge_logs: true,
      time: true,

      // ---- watch / misc ----
      watch: false,
      kill_timeout: 5000,
    },
  ],
};
