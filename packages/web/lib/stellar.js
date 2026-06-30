// Stellar/Soroban: wallet connect + submit the attest tx + read vouch count.
//
// DEMO MODE: connect/sign use a throwaway, friendbot-funded testnet keypair so the
// login state and the real signed transaction are visible and recordable without a
// browser extension. In production this swaps to the user's own wallet (Stellar
// Wallets Kit) and the secret never touches the client.
import * as StellarSdk from "@stellar/stellar-sdk";
import { hexToBytes } from "./snarkHex.js";

function rpc(cfg) {
  const ns = StellarSdk.SorobanRpc || StellarSdk.rpc;
  return new ns.Server(cfg.rpcUrl, { allowHttp: cfg.rpcUrl.startsWith("http://") });
}

export async function connectWallet(cfg) {
  // brief "connecting…" beat so the login reads as a real handshake
  await new Promise((r) => setTimeout(r, 650));
  return cfg.demoSignerPublicKey;
}

export async function submitAttest(cfg, _address, proofHex, publicHex) {
  const server = rpc(cfg);
  const kp = StellarSdk.Keypair.fromSecret(cfg.demoSignerSecret);
  const account = await server.getAccount(kp.publicKey());
  const contract = new StellarSdk.Contract(cfg.attestContractId);
  const op = contract.call(
    "attest",
    StellarSdk.xdr.ScVal.scvBytes(hexToBytes(proofHex)),
    StellarSdk.xdr.ScVal.scvBytes(hexToBytes(publicHex)),
  );
  let tx = new StellarSdk.TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: cfg.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();

  tx = await server.prepareTransaction(tx);
  tx.sign(kp);
  const sent = await server.sendTransaction(tx);

  let got = await server.getTransaction(sent.hash);
  const start = Date.now();
  while (got.status === "NOT_FOUND" && Date.now() - start < 30000) {
    await new Promise((r) => setTimeout(r, 1500));
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") {
    throw new Error("attest did not succeed: " + got.status);
  }
  return { count: StellarSdk.scValToNative(got.returnValue), hash: sent.hash };
}

// Read-only: how many unique humans vouch for this content hash.
export async function getVouches(cfg, _sourceAddress, contentHash32) {
  const server = rpc(cfg);
  const account = await server.getAccount(cfg.readSourcePublicKey);
  const contract = new StellarSdk.Contract(cfg.attestContractId);
  const op = contract.call("get_vouches", StellarSdk.xdr.ScVal.scvBytes(contentHash32));
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: cfg.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  const ns = StellarSdk.SorobanRpc || StellarSdk.rpc;
  if (ns.Api?.isSimulationError?.(sim) || sim.error) {
    throw new Error(typeof sim.error === "string" ? sim.error : "simulation error");
  }
  return StellarSdk.scValToNative(sim.result.retval);
}
