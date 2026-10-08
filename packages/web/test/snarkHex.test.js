import test from "node:test";
import assert from "node:assert";
import { cleanHex, hexToBytes } from "../lib/snarkHex.js";

test("cleanHex normalizes valid hex strings with 0x prefix and spaces", () => {
  assert.strictEqual(cleanHex("0xdeadBEEF"), "deadbeef");
  assert.strictEqual(cleanHex("  0x1a 2b 3c  "), "1a2b3c");
  assert.strictEqual(cleanHex(""), "");
});

test("cleanHex throws descriptive error on invalid hex characters", () => {
  assert.throws(
    () => cleanHex("zz"),
    /Invalid hex character: "z"/
  );
  assert.throws(
    () => cleanHex("0x12g4"),
    /Invalid hex character: "g"/
  );
  assert.throws(
    () => cleanHex("0x12?4"),
    /Invalid hex character: "\?"/
  );
});

test("cleanHex and hexToBytes reject nonstring inputs with TypeError", () => {
  assert.throws(
    () => cleanHex(10),
    TypeError
  );
  assert.throws(
    () => hexToBytes(10),
    TypeError
  );
  assert.throws(
    () => hexToBytes(null),
    TypeError
  );
  assert.throws(
    () => hexToBytes(undefined),
    TypeError
  );
});

test("hexToBytes successfully decodes valid hex to Uint8Array", () => {
  const bytes = hexToBytes("0xdeadBEEF");
  assert.strictEqual(bytes instanceof Uint8Array, true);
  assert.strictEqual(bytes.length, 4);
  assert.deepStrictEqual(Array.from(bytes), [0xde, 0xad, 0xbe, 0xef]);
});

test("hexToBytes returns empty Uint8Array for empty input", () => {
  const bytes = hexToBytes("");
  assert.strictEqual(bytes instanceof Uint8Array, true);
  assert.strictEqual(bytes.length, 0);
});

test("hexToBytes throws instead of returning zero bytes for non-hex input", () => {
  assert.throws(
    () => hexToBytes("zz"),
    /Invalid hex character: "z"/
  );
  assert.throws(
    () => hexToBytes("00zz"),
    /Invalid hex character: "z"/
  );
});

test("hexToBytes throws on odd length hex string", () => {
  assert.throws(
    () => hexToBytes("123"),
    /Hex string must have even length/
  );
});
