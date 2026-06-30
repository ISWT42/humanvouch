pragma circom 2.0.0;

include "./poseidon255.circom";

// Merkle inclusion over Poseidon255 (BLS12-381). pathIndices[i]==0 => running
// node is the LEFT child at level i; ==1 => RIGHT child.
template MerkleProof255(DEPTH) {
    signal input leaf;
    signal input pathElements[DEPTH];
    signal input pathIndices[DEPTH];
    signal output root;

    signal cur[DEPTH + 1];
    signal left[DEPTH];
    signal right[DEPTH];
    component h[DEPTH];

    cur[0] <== leaf;
    for (var i = 0; i < DEPTH; i++) {
        pathIndices[i] * (1 - pathIndices[i]) === 0;            // boolean
        // idx==0: (left,right)=(cur,sib); idx==1: (left,right)=(sib,cur)
        left[i]  <== cur[i] + pathIndices[i] * (pathElements[i] - cur[i]);
        right[i] <== pathElements[i] + pathIndices[i] * (cur[i] - pathElements[i]);
        h[i] = Poseidon255(2);
        h[i].in[0] <== left[i];
        h[i].in[1] <== right[i];
        cur[i + 1] <== h[i].out;
    }
    root <== cur[DEPTH];
}

template Attestation255(DEPTH) {
    signal input identitySecret;
    signal input pathElements[DEPTH];
    signal input pathIndices[DEPTH];
    signal input contentHash;       // public
    signal output root;             // public
    signal output nullifierHash;    // public

    component comm = Poseidon255(1);
    comm.in[0] <== identitySecret;

    component mk = MerkleProof255(DEPTH);
    mk.leaf <== comm.out;
    for (var i = 0; i < DEPTH; i++) {
        mk.pathElements[i] <== pathElements[i];
        mk.pathIndices[i] <== pathIndices[i];
    }
    root <== mk.root;

    component nh = Poseidon255(2);
    nh.in[0] <== identitySecret;
    nh.in[1] <== contentHash;
    nullifierHash <== nh.out;
}

component main {public [contentHash]} = Attestation255(10);
