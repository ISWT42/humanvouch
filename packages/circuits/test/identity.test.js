import { describe, it, expect } from "vitest";
import { getPoseidon, FIELD_PRIME } from "../lib/poseidon.js";
import { commitment, nullifierHash, hashToField } from "../lib/identity.js";

describe("poseidon", () => {
  it("hashes a single input deterministically to a field element", async () => {
    const p = await getPoseidon();
    const a = p.hash([1n]);
    const b = p.hash([1n]);
    expect(a).toBe(b);
    expect(a).toBeTypeOf("bigint");
    expect(a).toBeLessThan(FIELD_PRIME);
    expect(a).not.toBe(1n);
  });

  it("is sensitive to input order for two inputs", async () => {
    const p = await getPoseidon();
    expect(p.hash([1n, 2n])).not.toBe(p.hash([2n, 1n]));
  });
});

describe("identity", () => {
  it("commitment is Poseidon([secret]) and hides the secret", async () => {
    const c = await commitment(42n);
    const { getPoseidon } = await import("../lib/poseidon.js");
    const p = await getPoseidon();
    expect(c).toBe(p.hash([42n]));
    expect(c).not.toBe(42n);
  });

  it("nullifier binds secret AND content (different content => different nullifier)", async () => {
    const n1 = await nullifierHash(42n, 100n);
    const n2 = await nullifierHash(42n, 101n);
    const n3 = await nullifierHash(43n, 100n);
    expect(n1).not.toBe(n2);
    expect(n1).not.toBe(n3);
    expect(await nullifierHash(42n, 100n)).toBe(n1); // deterministic
  });

  it("hashToField is deterministic and inside the field", async () => {
    const enc = new TextEncoder();
    const h = hashToField(enc.encode("hello world"));
    expect(h).toBe(hashToField(enc.encode("hello world")));
    expect(h).toBeLessThan(FIELD_PRIME);
    expect(h).not.toBe(hashToField(enc.encode("hello worlD")));
  });
});
