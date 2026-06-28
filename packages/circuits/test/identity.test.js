import { describe, it, expect } from "vitest";
import { getPoseidon, FIELD_PRIME } from "../lib/poseidon.js";

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
