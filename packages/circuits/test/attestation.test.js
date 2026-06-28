import { describe, it, expect, beforeAll } from "vitest";
import { wasm as wasmTester } from "circom_tester";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { commitment, nullifierHash } from "../lib/identity.js";
import { buildTree } from "../lib/merkleTree.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const circuitPath = path.join(here, "../circuits/attestation.circom");
// circomlib lives at repo root node_modules, not packages/circuits/node_modules
const includePath = path.resolve(here, "../../../node_modules");

describe("attestation circuit", () => {
  let circuit;
  beforeAll(async () => {
    circuit = await wasmTester(circuitPath, { include: [includePath] });
  });

  it("computes root and nullifier for a valid member", async () => {
    const secret = 12345n;
    const contentHash = 67890n;
    const c = await commitment(secret);
    const tree = await buildTree([c, 2n, 3n, 4n], 20);
    const { pathElements, pathIndices } = tree.proof(0);

    const w = await circuit.calculateWitness(
      {
        identitySecret: secret,
        pathElements,
        pathIndices,
        contentHash,
      },
      true
    );
    await circuit.checkConstraints(w);

    // Public outputs land at fixed witness positions; assert via the helper.
    await circuit.assertOut(w, {
      root: tree.root,
      nullifierHash: await nullifierHash(secret, contentHash),
    });
  });

  it("a non-member produces a root that differs from the registry root", async () => {
    const secret = 999n;
    const contentHash = 1n;
    const realMember = await commitment(111n);
    const tree = await buildTree([realMember, 2n, 3n, 4n], 20);
    const { pathElements, pathIndices } = tree.proof(0); // path for realMember

    // Feed the wrong secret with someone else's path: circuit still computes A root,
    // but it must NOT equal the registry root (membership is not satisfied).
    const w = await circuit.calculateWitness(
      { identitySecret: secret, pathElements, pathIndices, contentHash },
      true
    );
    // w[1] = root (first public output, after w[0]=1 constant)
    const outRoot = w[1];
    expect(outRoot).not.toBe(tree.root);
  });

  it("rejects a non-boolean pathIndices value (enforces boolean constraint)", async () => {
    const secret = 12345n;
    const contentHash = 67890n;
    const c = await commitment(secret);
    const tree = await buildTree([c, 2n, 3n, 4n], 20);
    const { pathElements, pathIndices } = tree.proof(0);

    // Corrupt one pathIndices entry to 2 (not 0 or 1)
    const badIndices = [...pathIndices];
    badIndices[0] = 2;

    await expect(
      circuit.calculateWitness(
        { identitySecret: secret, pathElements, pathIndices: badIndices, contentHash },
        true
      )
    ).rejects.toThrow();
  });
});
