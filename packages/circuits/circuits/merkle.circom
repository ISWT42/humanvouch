pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/mux1.circom";

// Recompute a Poseidon merkle root from a leaf and its inclusion path.
// pathIndices[i] == 0  => running node is the LEFT child at level i
// pathIndices[i] == 1  => running node is the RIGHT child at level i
template MerkleProof(DEPTH) {
    signal input leaf;
    signal input pathElements[DEPTH];
    signal input pathIndices[DEPTH];
    signal output root;

    signal hashes[DEPTH + 1];
    hashes[0] <== leaf;

    component mux[DEPTH];
    component hasher[DEPTH];

    for (var i = 0; i < DEPTH; i++) {
        // enforce boolean index
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        mux[i] = MultiMux1(2);
        mux[i].c[0][0] <== hashes[i];        // left  when index = 0
        mux[i].c[0][1] <== pathElements[i];  // left  when index = 1
        mux[i].c[1][0] <== pathElements[i];  // right when index = 0
        mux[i].c[1][1] <== hashes[i];        // right when index = 1
        mux[i].s <== pathIndices[i];

        hasher[i] = Poseidon(2);
        hasher[i].inputs[0] <== mux[i].out[0];
        hasher[i].inputs[1] <== mux[i].out[1];

        hashes[i + 1] <== hasher[i].out;
    }

    root <== hashes[DEPTH];
}
