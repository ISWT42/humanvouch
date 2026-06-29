# Addendum — BLS12-381 migration & on-chain build plan

- **Date:** 2026-06-29
- **Status:** Recon complete; supersedes the curve choice in the Plan 01 spec.
- **Why this exists:** Pre-build recon for the on-chain demo surfaced a hard incompatibility. Recording it so the pivot isn't lost.

## The finding (mechanism)

Soroban verifies SNARKs with Stellar's **native BLS12-381 host functions** (Protocol 22+: `crypto::bls12_381`, `bls.pairing_check`). The official `stellar/soroban-examples/groth16_verifier` is **BLS12-381 only** (`VerificationKey { alpha: G1Affine, beta/gamma/delta: G2Affine, ic: Vec<G1Affine> }`, `Proof { a: G1Affine, b: G2Affine, c: G1Affine }`, `verify_proof(env, vk, proof, pub_signals: Vec<Fr>)`). There is **no native BN254 pairing on Stellar**, and a BN254 verifier in pure Soroban Rust would be cost-prohibitive.

**Consequence:** any on-chain SNARK on Stellar must be **BLS12-381**. Plan 01 was built on **BN254** (`snarkjs powersoftau new bn128`). Its artifacts (`.zkey`, `verification_key.json`) are **superseded** for the on-chain path. The Plan 01 *structure* (libs, Merkle tree, genProof, build pipeline, tests) is reused; only the curve + hash primitive change.

The hackathon's own reference (`jamesbachini/CircomStellar`) uses a trivial `multiplier2` circuit (no hash), confirming nobody has demoed a Poseidon-Merkle membership proof on Stellar yet — this is the novel, risky part.

## Resolved unknowns

| Concern | Resolution |
|---|---|
| Curve | BLS12-381. Compile `circom --prime bls12381`; setup `snarkjs ... bls12381`. |
| On-chain verifier | Reuse `soroban-examples/groth16_verifier` (BLS12-381). Wrap with our Registry/Attest. |
| Proof → contract format | `circom_to_soroban_hex` tool (from CircomStellar) converts snarkjs `proof.json`/`public.json` → hex bytes; contract called as `verify --proof_bytes <hex> --pub_signals_bytes <hex>`. |
| In-circuit hash | `jmagan/poseidon-bls12381-circom` — provides `poseidon255.circom` + `poseidon255_constants.circom` (783 KB of round constants / MDS). |
| Off-chain hash (JS) | **Must build.** No JS impl ships with jmagan's repo. Implement Poseidon-bls12381 in JS over ffjavascript's BLS12-381 Fr + parsed constants. **Correctness oracle:** `poseidon([1,2]) == 0x3fb8310b0e962b75bffec5f9cfcbf3f965a7b1d2dcac8d95ccb13d434e08e5fa`. |
| Tooling | `stellar-cli` 27.0.0 (`~/.local/bin/stellar`), `wasm32v1-none` + `wasm32-unknown-unknown` targets, `circom` 2.2.2, `cargo` 1.96 — all installed. Build target is `wasm32v1-none`. |

## Phased plan (de-risk highest-risk integration first)

**Plan 02 — Phase A: prove the BLS12-381 pipe (low risk, high info).**
Trivial circuit (`multiplier2`) over bls12381 → snarkjs proof → deploy the official groth16 verifier to **testnet** (Friendbot-funded account) → `stellar contract invoke verify` returns `true` on-chain. Confirms the entire BLS12-381 chain works on this machine before investing in the membership circuit.

**Plan 02 — Phase B: the real circuit + contracts.**
Swap the trivial circuit for membership + content-nullifier using Poseidon-bls12381. Rebuild trusted setup over bls12381 (reduce Merkle depth if proving cost demands). Build the off-chain JS Poseidon-bls12381 (verified vs the oracle vector). Wrap the verifier in `AttestContract` (membership `is_valid_root` MUST + replay guard + record) and `RegistryContract` (root). Enforce the invariants from the Plan 01 final review: on-chain `is_valid_root` is mandatory; public-signal order `[0]=root, [1]=nullifierHash, [2]=contentHash`.

**Plan 03 — Phase C: wallet + frontend + deploy.**
Nuxt nitro `server/api/` routes (relay attest tx, query vouches, Medium/X adapters, canonical normalization) instead of a standalone Express app — so the whole app deploys to one free platform. Wallet connect via **Stellar Wallets Kit** (user connects their own wallet; we never touch keys). Browser proof generation. Deploy to **Cloudflare Pages** + **Turso** (free); contracts on **Soroban testnet** (free).

## Honest caveats (carry into the demo video / README)

- Trusted setup remains a non-production demo ceremony (forgeable). Production needs a real MPC.
- Off-chain Poseidon-bls12381 uses community constants (jmagan); validated against a test vector, not a formal audit.
- Merkle depth may be reduced for the demo to keep browser proving snappy; note the registry capacity.
