import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFile } from "node:fs/promises";
import * as snarkjs from "snarkjs";
import { buildTree } from "../lib/merkleTree.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const WASM = path.join(here, "../build/attestation_js/attestation.wasm");
const ZKEY = path.join(here, "../build/attestation_final.zkey");
const VKEY = path.join(here, "../build/verification_key.json");

export async function generateAttestationProof({
  identitySecret,
  contentHash,
  leaves,
  leafIndex,
  depth = 20,
}) {
  const tree = await buildTree(leaves, depth);
  const { pathElements, pathIndices } = tree.proof(leafIndex);

  const input = {
    identitySecret: identitySecret.toString(),
    contentHash: contentHash.toString(),
    pathElements: pathElements.map((x) => x.toString()),
    pathIndices: pathIndices.map((x) => x.toString()),
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);
  return { proof, publicSignals };
}

export async function verifyAttestationProof(proof, publicSignals) {
  const vkey = JSON.parse(await readFile(VKEY, "utf8"));
  return snarkjs.groth16.verify(vkey, publicSignals, proof);
}
