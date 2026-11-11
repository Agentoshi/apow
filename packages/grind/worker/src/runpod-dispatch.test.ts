import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { dispatchRunpodRunsync } from "./index.js";

const env = { RUNPOD_ENDPOINT: "https://runpod.invalid/v2/test", RUNPOD_API_KEY: "test-only" };
const input = { challenge: "test", target: "test", address: "test" };
const paused = () => Response.json({ code: "ENDPOINT_PAUSED" }, { status: 409 });

function clock(t: TestContext) {
  let now = 0;
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "setTimeout", (fn: () => void, delay: number) => {
    now += delay;
    queueMicrotask(fn);
    return 0;
  });
  return () => now;
}

const dispatch = (signal = new AbortController().signal) =>
  dispatchRunpodRunsync(env as Parameters<typeof dispatchRunpodRunsync>[0], input, signal);

test("cold endpoint can become ready after 15 seconds without duplicate accepted jobs", async (t) => {
  const now = clock(t);
  let calls = 0;
  let accepted = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (now() < 40_000) return paused();
    accepted++;
    return Response.json({ id: "one-job", status: "IN_QUEUE" });
  });
  assert.equal((await dispatch()).status, 200);
  assert.equal(accepted, 1);
  assert.ok(calls <= 6);
});

test("permanently paused endpoint stops within 60 seconds and six outbound calls", async (t) => {
  const now = clock(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; return paused(); });
  assert.equal((await dispatch()).status, 409);
  assert.equal(now(), 60_000);
  assert.ok(calls <= 6);
});

for (const status of [200, 409, 500]) {
  test(`HTTP ${status} without ENDPOINT_PAUSED is never resubmitted`, async (t) => {
    clock(t);
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json({ code: "OTHER", message: "Not ENDPOINT_PAUSED" }, { status });
    });
    assert.equal((await dispatch()).status, status);
    assert.equal(calls, 1);
  });
}

test("a lost response is never resubmitted", async (t) => {
  clock(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("lost response"); });
  await assert.rejects(dispatch(), /lost response/);
  assert.equal(calls, 1);
});
