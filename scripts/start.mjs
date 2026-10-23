import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const port = process.env.PORT || "3000";
process.env.HOSTNAME = "0.0.0.0";
console.log(`[start] binding 0.0.0.0:${port}`);
const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "start", "-H", "0.0.0.0", "-p", String(port)], {
  stdio: "inherit",
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
