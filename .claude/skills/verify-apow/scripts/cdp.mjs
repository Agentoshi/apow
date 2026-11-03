#!/usr/bin/env node
// Minimal headless-Chrome driver over the DevTools protocol (Node 22+, no deps).
// Usage: node cdp.mjs <url> <out-prefix> [step ...]
//   step = JS expression evaluated in the page (awaited). A falsy result fails the run.
//   Writes <out-prefix>.png and <out-prefix>.log (each step and its result).
// Example: node cdp.mjs http://127.0.0.1:8792/ /tmp/x "document.title.includes('APoW')"
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const [url, out, ...steps] = process.argv.slice(2);
if (!url || !out) { console.error("usage: cdp.mjs <url> <out-prefix> [step ...]"); process.exit(2); }
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = mkdtempSync(join(tmpdir(), "apow-verify-cdp-"));
mkdirSync(dirname(out), { recursive: true });
const proc = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--window-size=1280,900", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

// Page helpers available to steps:
//   waitFor(fn, ms=15000)  resolves fn()'s first truthy value, or false on timeout
//   text()                 visible body text
//   fill(selector, value)  sets a React-controlled input the way typing does
//   click(label)           clicks the button or link named label (exact match first, then substring)
const HELPERS = `Object.assign(window, {
  waitFor: async (fn, ms = 15000) => { const end = Date.now() + ms;
    while (Date.now() < end) { const v = await fn(); if (v) return v; await new Promise(r => setTimeout(r, 200)); }
    return false; },
  text: () => document.body.innerText,
  fill: (sel, value) => { const el = document.querySelector(sel); if (!el) return false;
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true })); return true; },
  click: (label) => { const all = [...document.querySelectorAll('button,a,[role=button]')];
    const name = e => (e.innerText.trim() + ' ' + (e.getAttribute('aria-label') ?? '')).trim().toLowerCase();
    const want = label.toLowerCase();
    const el = all.find(e => name(e) === want) ?? all.find(e => name(e).includes(want));
    if (!el) return false; el.click(); return true; },
}) && true`;

const log = [];
const note = (line) => { console.log(line); log.push(line); };
let exitCode = 0;

try {
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = "";
    proc.stderr.on("data", (d) => {
      buf += d;
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
      if (m) resolve(m[1]);
    });
    proc.on("exit", () => reject(new Error("chrome exited before DevTools was ready")));
  });
  const browser = new WebSocket(wsUrl);
  await new Promise((r) => browser.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  browser.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
    browser.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const page = (m, p) => send(m, p, sessionId);
  await page("Page.enable");
  await page("Page.navigate", { url });
  const evaluate = async (expr) => {
    const r = await page("Runtime.evaluate", { expression: `(async () => (${expr}))()`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  await evaluate("new Promise(r => document.readyState === 'complete' ? r(true) : addEventListener('load', () => r(true)))");
  await evaluate(HELPERS);
  note(`OPEN ${url}`);
  for (const step of steps) {
    const value = await evaluate(step);
    const ok = Boolean(value);
    note(`${ok ? "PASS" : "FAIL"} ${step} => ${JSON.stringify(value)}`);
    if (!ok) { exitCode = 1; break; }
  }
  const { data } = await page("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${out}.png`, Buffer.from(data, "base64"));
  note(`SHOT ${out}.png`);
  browser.close();
} catch (err) {
  note(`ERROR ${err.message}`);
  exitCode = 1;
} finally {
  writeFileSync(`${out}.log`, log.join("\n") + "\n");
  const exited = new Promise((r) => proc.once("exit", r));
  proc.kill();
  await exited;
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
process.exit(exitCode);
