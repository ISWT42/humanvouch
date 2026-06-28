# @humanvouch/circuits

Circom/Groth16 circuit proving anonymous unique-human content attestation.

## What it proves
Given a private `identitySecret` and a Poseidon Merkle registry, the circuit proves:
- `commitment = Poseidon([identitySecret])` is a member of the tree (output `root`), and
- `nullifierHash = Poseidon([identitySecret, contentHash])` is correctly derived.
Public signals: `root`, `nullifierHash`, `contentHash`. Nothing else is revealed.

## Build
Requires the Circom compiler on PATH (`circom --version` → 2.1.x).
`yarn workspace @humanvouch/circuits build`
Artifacts: `build/attestation_js/attestation.wasm`, `build/attestation_final.zkey`, `build/verification_key.json`.

## API
- `generateAttestationProof({ identitySecret, contentHash, leaves, leafIndex, depth=20 })` → `{ proof, publicSignals }`
- `verifyAttestationProof(proof, publicSignals)` → `boolean`
- `buildTree(leaves, depth=20)` → `{ root, proof(i), depth }`
- `commitment(secret)`, `nullifierHash(secret, contentHash)`, `hashToField(bytes)`

## Consumed by
- Plan 02 (Soroban): `verification_key.json` → on-chain Groth16 verifier.
- Plan 03 (API): `generateAttestationProof` → attestation payload; `hashToField` → canonical content hash.
