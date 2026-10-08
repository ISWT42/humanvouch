import test from "node:test";
import assert from "node:assert";
import { resolveShareView } from "../lib/shareView.js";

test("resolveShareView captures standard Error and sets failed=true", async () => {
  const result = await resolveShareView("1234567890", async () => {
    throw new Error("RPC node timeout connecting to Soroban");
  });

  assert.strictEqual(result.loading, false);
  assert.strictEqual(result.failed, true);
  assert.strictEqual(result.error, "RPC node timeout connecting to Soroban");
  assert.strictEqual(result.count, null);
});

test("resolveShareView captures empty Error message without falling back to unvouched", async () => {
  const result = await resolveShareView("1234567890", async () => {
    throw new Error("");
  });

  assert.strictEqual(result.loading, false);
  assert.strictEqual(result.failed, true);
  assert.strictEqual(result.error, "On-chain attestation resolution failed");
  assert.strictEqual(result.count, null);
});

test("resolveShareView captures thrown primitive string", async () => {
  const result = await resolveShareView("1234567890", async () => {
    throw "Cloudflare gateway 502";
  });

  assert.strictEqual(result.loading, false);
  assert.strictEqual(result.failed, true);
  assert.strictEqual(result.error, "Cloudflare gateway 502");
  assert.strictEqual(result.count, null);
});

test("resolveShareView handles legitimate zero vouches with failed=false", async () => {
  const result = await resolveShareView("1234567890", async () => 0);

  assert.strictEqual(result.loading, false);
  assert.strictEqual(result.failed, false);
  assert.strictEqual(result.error, null);
  assert.strictEqual(result.count, 0);
});

test("resolveShareView handles positive vouches and content with failed=false", async () => {
  const result = await resolveShareView(
    "1234567890",
    async () => 3,
    (hf) => "Verified report content"
  );

  assert.strictEqual(result.loading, false);
  assert.strictEqual(result.failed, false);
  assert.strictEqual(result.error, null);
  assert.strictEqual(result.count, 3);
  assert.strictEqual(result.content, "Verified report content");
});
