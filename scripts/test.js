const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
// Run both suites even when the first reports regressions.
const suites = [
  ["server", root, "client/node_modules/jest/bin/jest.js", ["--config", "server/jest.config.js", "--runInBand"]],
  ["client", path.join(root, "client"), "node_modules/react-scripts/bin/react-scripts.js", ["test", "--watchAll=false", "--runInBand"]],
];

let failed = false;
for (const [name, cwd, runner, args] of suites) {
  console.log(`Running ${name} tests`);
  const result = spawnSync(process.execPath, [runner, ...args], {
    cwd,
    stdio: "inherit",
    env: { ...process.env, CI: "true" },
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
