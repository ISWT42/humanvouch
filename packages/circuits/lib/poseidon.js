import { buildPoseidon } from "circomlibjs";

export const FIELD_PRIME =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

let _poseidon = null;

export async function getPoseidon() {
  if (_poseidon) return _poseidon;
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  _poseidon = {
    F,
    hash(inputs) {
      // poseidon() returns a field element in Montgomery form; F.toObject -> bigint
      const out = poseidon(inputs.map((x) => F.e(x)));
      return F.toObject(out);
    },
  };
  return _poseidon;
}
