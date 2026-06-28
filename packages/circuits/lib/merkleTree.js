import { getPoseidon } from "./poseidon.js";

// Fixed-depth binary Merkle tree over Poseidon, zero-filled.
export async function buildTree(leaves, depth = 20) {
  const p = await getPoseidon();

  // Precompute zero subtree roots per level.
  const zeros = [0n];
  for (let i = 1; i <= depth; i++) zeros[i] = p.hash([zeros[i - 1], zeros[i - 1]]);

  // Level 0 = padded leaves.
  const level = leaves.slice();
  const layers = [level];
  for (let d = 0; d < depth; d++) {
    const cur = layers[d];
    const next = [];
    for (let i = 0; i < cur.length; i += 2) {
      const left = cur[i];
      const right = i + 1 < cur.length ? cur[i + 1] : zeros[d];
      next.push(p.hash([left, right]));
    }
    if (next.length === 0) next.push(zeros[d + 1]);
    layers.push(next);
  }

  const root = layers[depth][0];

  function proof(leafIndex) {
    if (
      !Number.isInteger(leafIndex) ||
      leafIndex < 0 ||
      leafIndex >= leaves.length
    ) {
      throw new Error(
        `proof: leafIndex must be an integer in [0, ${leaves.length}); got ${leafIndex}`
      );
    }
    const pathElements = [];
    const pathIndices = [];
    let idx = leafIndex;
    for (let d = 0; d < depth; d++) {
      const cur = layers[d];
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;
      const sibling = siblingIdx < cur.length ? cur[siblingIdx] : zeros[d];
      pathElements.push(sibling);
      pathIndices.push(isRight ? 1 : 0);
      idx = Math.floor(idx / 2);
    }
    return { pathElements, pathIndices };
  }

  return { root, proof, depth };
}
