import { describe, it, expect } from "vitest";
import { getPoseidon } from "../lib/poseidon.js";
import { buildTree } from "../lib/merkleTree.js";

describe("merkleTree", () => {
  it("recomputes the root from a member's proof", async () => {
    const p = await getPoseidon();
    const leaves = [11n, 22n, 33n, 44n];
    const tree = await buildTree(leaves, 20);
    const { pathElements, pathIndices } = tree.proof(2); // leaf 33n

    // Re-walk the path exactly as the circuit will.
    let node = 33n;
    for (let i = 0; i < pathElements.length; i++) {
      node =
        pathIndices[i] === 0
          ? p.hash([node, pathElements[i]])
          : p.hash([pathElements[i], node]);
    }
    expect(node).toBe(tree.root);
  });

  it("a non-member proof does not reproduce the root", async () => {
    const p = await getPoseidon();
    const tree = await buildTree([11n, 22n, 33n, 44n], 20);
    const { pathElements, pathIndices } = tree.proof(0);
    let node = 999n; // wrong leaf
    for (let i = 0; i < pathElements.length; i++) {
      node =
        pathIndices[i] === 0
          ? p.hash([node, pathElements[i]])
          : p.hash([pathElements[i], node]);
    }
    expect(node).not.toBe(tree.root);
  });

  it("proof() throws for out-of-range leafIndex", async () => {
    const tree = await buildTree([11n, 22n, 33n, 44n], 20);
    expect(() => tree.proof(-1)).toThrow();
    expect(() => tree.proof(4)).toThrow();
    expect(() => tree.proof(100)).toThrow();
  });
});
