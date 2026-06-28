import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { commitment } from "../lib/identity.js";
import { generateAttestationProof, verifyAttestationProof } from "../scripts/genProof.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const built = existsSync(path.join(here, "../build/attestation_final.zkey"));

describe.runIf(built)("groth16 proof round-trip", () => {
  it("verifies a valid attestation and rejects a tampered public signal", async () => {
    const secret = 7777n;
    const contentHash = 424242n;
    const member = await commitment(secret);
    const leaves = [member, 2n, 3n, 4n];

    const { proof, publicSignals } = await generateAttestationProof({
      identitySecret: secret,
      contentHash,
      leaves,
      leafIndex: 0,
    });

    expect(await verifyAttestationProof(proof, publicSignals)).toBe(true);

    const tampered = [...publicSignals];
    tampered[0] = (BigInt(tampered[0]) + 1n).toString(); // flip root
    expect(await verifyAttestationProof(proof, tampered)).toBe(false);

    const tamperedContent = [...publicSignals];
    tamperedContent[2] = (BigInt(tamperedContent[2]) + 1n).toString(); // flip contentHash
    expect(await verifyAttestationProof(proof, tamperedContent)).toBe(false);
  });
});
