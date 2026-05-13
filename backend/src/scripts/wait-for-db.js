import net from "node:net";
import { URL } from "node:url";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePostgresUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port || "5432"),
  };
}

async function waitForTcp({ host, port, timeoutMs }) {
  const startedAt = Date.now();
  // Basic TCP dial loop is enough here; postgres itself will refuse connections
  // until ready anyway, but this gets us past the "container not listening yet" phase.
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const socket = net.connect({ host, port });
        socket.setTimeout(1000);
        socket.on("connect", () => {
          socket.end();
          resolve();
        });
        socket.on("timeout", () => {
          socket.destroy();
          reject(new Error("timeout"));
        });
        socket.on("error", reject);
      });
      return;
    } catch {
      await sleep(300);
    }
  }

  throw new Error(`Database not reachable at ${host}:${port} within ${timeoutMs}ms`);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const { host, port } = parsePostgresUrl(databaseUrl);
await waitForTcp({ host, port, timeoutMs: 30_000 });
console.log(`Database reachable at ${host}:${port}`);

