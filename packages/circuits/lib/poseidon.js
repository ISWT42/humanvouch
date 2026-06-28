import { buildPoseidon } from "circomlibjs";

export const FIELD_PRIME =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

let _poseidonPromise = null;

export async function getPoseidon() {
  if (!_poseidonPromise) {
    _poseidonPromise = buildPoseidon().then((poseidon) => {
      const F = poseidon.F;
      return {
        F,
        hash(inputs) {
          // poseidon() returns a field element in Montgomery form; F.toObject -> bigint
          const out = poseidon(inputs.map((x) => F.e(x)));
          return F.toObject(out);
        },
      };
    });
  }
  return _poseidonPromise;
}
