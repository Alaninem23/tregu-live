import net from "node:net";

const host = process.argv[2] || "127.0.0.1";
const port = parseInt(process.argv[3] || "8000", 10);

console.log(`[TCP] Trying ${host}:${port} ...`);

const socket = net.createConnection({ host, port, timeout: 4000 });

socket.on("connect", () => {
  console.log(`[TCP] SUCCESS: Connected to ${host}:${port}`);
  socket.end();
});

socket.on("timeout", () => {
  console.error(`[TCP] TIMEOUT: Cannot connect to ${host}:${port} (4s)`);
  socket.destroy();
});

socket.on("error", (err) => {
  console.error(`[TCP] ERROR name=${err?.name} message=${err?.message}`);
  if (err?.code) console.error(`[TCP] code=${err.code}`);
  if (err?.errno !== undefined) console.error(`[TCP] errno=${err.errno}`);
  if (err?.stack) console.error(`[TCP] stack=\n${err.stack}`);
  if (err?.errors && Array.isArray(err.errors)) {
    console.error(`[TCP] AggregateError contains ${err.errors.length} inner error(s):`);
    for (let i = 0; i < err.errors.length; i++) {
      const e = err.errors[i];
      console.error(`  [${i}] name=${e?.name} code=${e?.code} message=${e?.message}`);
    }
  }
});

socket.on("close", () => {
  console.log("[TCP] Closed.");
});
