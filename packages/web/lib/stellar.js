// Stellar/Soroban: wallet connect + submit the attest tx + read vouch count.
import * as StellarSdk from "@stellar/stellar-sdk";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";
import { hexToBytes } from "./snarkHex.js";

let kit = null;
function getKit() {
  if (!kit) {
    kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }
  return kit;
}

export function connectWallet() {
  const k = getKit();
  return new Promise((resolve, reject) => {
    k.openModal({
      onWalletSelected: async (option) => {
        try {
          k.setWallet(option.id);
          const { address } = await k.getAddress();
          resolve(address);
        } catch (e) {
          reject(e);
        }
      },
      onClosed: () => reject(new Error("Wallet selection cancelled")),
    });
  });
}

function rpc(cfg) {
  const ns = StellarSdk.SorobanRpc || StellarSdk.rpc;
  return new ns.Server(cfg.rpcUrl, { allowHttp: cfg.rpcUrl.startsWith("http://") });
}

// Submit a real `attest` transaction, signed by the connected wallet.
export async function submitAttest(cfg, address, proofHex, publicHex) {
  const server = rpc(cfg);
  const account = await server.getAccount(address);
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

  const { signedTxXdr } = await getKit().signTransaction(tx.toXDR(), {
    address,
    networkPassphrase: cfg.networkPassphrase,
  });
  const signed = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, cfg.networkPassphrase);
  const sent = await server.sendTransaction(signed);

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
export async function getVouches(cfg, sourceAddress, contentHash32) {
  const server = rpc(cfg);
  const account = await server.getAccount(sourceAddress || cfg.readSourcePublicKey);
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
