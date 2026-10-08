import test from "node:test";
import assert from "node:assert";
import { TurnstilePoller } from "../lib/turnstilePoller.js";

test("TurnstilePoller polls and renders when ready", async () => {
  let rendered = false;
  let readyState = false;

  const poller = new TurnstilePoller({
    intervalMs: 10,
    maxAttempts: 10,
  });

  poller.poll(
    () => readyState,
    () => {
      rendered = true;
    }
  );

  assert.strictEqual(rendered, false);

  // Set ready after 25ms
  setTimeout(() => {
    readyState = true;
  }, 25);

  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.strictEqual(rendered, true);
  assert.ok(poller.attempts < 10);
});

test("TurnstilePoller stops polling and invokes onError when maxAttempts reached", async () => {
  let errorReported = "";
  let rendered = false;

  const poller = new TurnstilePoller({
    intervalMs: 10,
    maxAttempts: 3,
    onError: (msg) => {
      errorReported = msg;
    },
  });

  poller.poll(
    () => false, // never ready
    () => {
      rendered = true;
    }
  );

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.strictEqual(rendered, false);
  assert.strictEqual(poller.attempts, 3);
  assert.ok(errorReported.includes("Turnstile widget failed to load"));
});

test("TurnstilePoller stop() cancels active timer on unmount", async () => {
  let errorReported = "";
  let rendered = false;

  const poller = new TurnstilePoller({
    intervalMs: 20,
    maxAttempts: 10,
    onError: (msg) => {
      errorReported = msg;
    },
  });

  poller.poll(
    () => false,
    () => {
      rendered = true;
    }
  );

  // Stop early (simulating onUnmounted)
  await new Promise((resolve) => setTimeout(resolve, 10));
  poller.stop();
  const attemptsAtStop = poller.attempts;

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.strictEqual(poller.attempts, attemptsAtStop);
  assert.strictEqual(rendered, false);
  assert.strictEqual(errorReported, "");
  assert.strictEqual(poller.timer, null);
});
