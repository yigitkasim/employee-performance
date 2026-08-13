import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = "/tmp/claude-0/-home-claude-repo/5670ef93-8da0-5d2d-a817-5030e0495a5b/scratchpad";
const token = readFileSync(`${OUT}/token.txt`, "utf8").trim();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.addCookies([
  { name: "gm_session", value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
]);
const page = await ctx.newPage();

const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(`${BASE}/app`, { waitUntil: "domcontentloaded", timeout: 30000 });
console.log("after auth, url =", page.url());

const shots = [
  ["team", "/app"],
  ["profile", "/app/profile"],
  ["skills", "/app/skills"],
  ["gaps", "/app/gaps"],
  ["simulator", "/app/simulator"],
  ["self", "/app/self"],
  ["compare", "/app/compare"],
  ["promotion", "/app/promotion"],
  ["framework", "/app/framework"],
];

for (const [name, path] of shots) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1600); // let charts draw
  await page.screenshot({ path: `${OUT}/shot-${name}.png`, fullPage: false });
  // count rendered canvases (charts)
  const canvases = await page.locator("canvas").count();
  console.log(`${name}: ${path} — canvases=${canvases}`);
}

console.log("CONSOLE_ERRORS:", errors.length);
errors.slice(0, 15).forEach((e) => console.log("  -", e));
await browser.close();
