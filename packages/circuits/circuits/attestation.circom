pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "./merkle.circom";

template Attestation(DEPTH) {
    // private
    signal input identitySecret;
    signal input pathElements[DEPTH];
    signal input pathIndices[DEPTH];
    // public input
    signal input contentHash;
    // public outputs
    signal output root;
    signal output nullifierHash;

    component commitmentHasher = Poseidon(1);
    commitmentHasher.inputs[0] <== identitySecret;

    component merkle = MerkleProof(DEPTH);
    merkle.leaf <== commitmentHasher.out;
    for (var i = 0; i < DEPTH; i++) {
        merkle.pathElements[i] <== pathElements[i];
        merkle.pathIndices[i] <== pathIndices[i];
    }
    root <== merkle.root;

    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identitySecret;
    nullifierHasher.inputs[1] <== contentHash;
    nullifierHash <== nullifierHasher.out;
}

component main {public [contentHash]} = Attestation(20);
