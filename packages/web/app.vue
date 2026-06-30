<script setup lang="ts">
const cfg = useRuntimeConfig().public;

const registry = ref<any>(null);
const wallet = ref<string>("");
const walletErr = ref<string>("");

// vouch flow
const memberId = ref(0);
const content = ref(
  "Investigation: the budget figures the ministry released do not add up. — by a real human.",
);
const vStatus = ref("");
const vBusy = ref(false);
const vResult = ref<{ count: number; hash: string } | null>(null);
const vErr = ref("");

// verify flow
const vcontent = ref("");
const verBusy = ref(false);
const verCount = ref<number | null>(null);
const verErr = ref("");

// agent / x402 demo state
const agentBusy = ref(false);
const agent402 = ref<any>(null);
const agent200 = ref<any>(null);
const agentErr = ref("");

onMounted(async () => {
  try {
    const { loadRegistry } = await import("~/lib/zk.js");
    registry.value = await loadRegistry();
    if (registry.value?.demoContent) content.value = registry.value.demoContent;
  } catch (e: any) {
    vErr.value = "registry load failed: " + e.message;
  }
});

async function runAgentQuery() {
  agentErr.value = "";
  agent402.value = null;
  agent200.value = null;
  agentBusy.value = true;
  try {
    const url = "/api/v1/attestation?content=" + encodeURIComponent(content.value);
    const r1 = await fetch(url);
    agent402.value = { status: r1.status, body: await r1.json() };
    await new Promise((r) => setTimeout(r, 700));
    const r2 = await fetch(url, { headers: { "X-Payment": "stellar-testnet:demo-receipt" } });
    agent200.value = { status: r2.status, body: await r2.json() };
  } catch (e: any) {
    agentErr.value = e.message || String(e);
  } finally {
    agentBusy.value = false;
  }
}

function short(a: string) {
  return a ? a.slice(0, 5) + "…" + a.slice(-4) : "";
}

async function connect() {
  walletErr.value = "";
  try {
    const { connectWallet } = await import("~/lib/stellar.js");
    wallet.value = await connectWallet();
  } catch (e: any) {
    walletErr.value = e.message || "connection failed";
  }
}

async function doVouch() {
  vErr.value = "";
  vResult.value = null;
  if (!wallet.value) {
    await connect();
    if (!wallet.value) return;
  }
  vBusy.value = true;
  try {
    const zk = await import("~/lib/zk.js");
    const st = await import("~/lib/stellar.js");
    const member = registry.value.members[memberId.value];

    vStatus.value = "Hashing content…";
    const ch = await zk.contentHashField(content.value);

    vStatus.value = "Generating zero-knowledge proof in your browser…";
    const { proofHex, publicHex } = await zk.generateVouchProof(member, ch);

    vStatus.value = "Sign the transaction in your wallet…";
    const res = await st.submitAttest(cfg, wallet.value, proofHex, publicHex);

    vStatus.value = "";
    vResult.value = res;
  } catch (e: any) {
    vErr.value = e.message || String(e);
  } finally {
    vBusy.value = false;
  }
}

async function doVerify() {
  verErr.value = "";
  verCount.value = null;
  verBusy.value = true;
  try {
    const zk = await import("~/lib/zk.js");
    const st = await import("~/lib/stellar.js");
    const ch = await zk.contentHashField(vcontent.value || content.value);
    const bytes32 = zk.toBytes32BE(ch);
    verCount.value = await st.getVouches(cfg, wallet.value || null, bytes32);
  } catch (e: any) {
    verErr.value = e.message || String(e);
  } finally {
    verBusy.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
    <div class="relative mx-auto max-w-doc border border-ink-600">
      <span class="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-brass/60" />
      <span class="pointer-events-none absolute right-2 top-2 h-2 w-2 border-r border-t border-brass/60" />
      <span class="pointer-events-none absolute bottom-2 left-2 h-2 w-2 border-b border-l border-brass/60" />
      <span class="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b border-r border-brass/60" />

      <!-- masthead -->
      <header class="flex items-center justify-between border-b border-ink-600 px-6 py-4 sm:px-10">
        <span class="font-display text-xl font-semibold tracking-tight text-paper">HumanVouch</span>
        <button
          class="rounded-sm border border-ink-600 px-3 py-1.5 font-mono text-xs text-paper-dim transition hover:border-brass hover:text-brass-light"
          @click="connect"
        >
          {{ wallet ? short(wallet) : "Connect wallet" }}
        </button>
      </header>

      <!-- hero -->
      <section class="grid items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:py-16">
        <div class="order-2 lg:order-1">
          <p class="eyebrow">Real-World ZK · Stellar testnet · live</p>
          <h1 class="mt-5 font-display text-[2.4rem] font-normal leading-[1.05] tracking-[-0.01em] text-paper sm:text-5xl">
            Proof that a real,<br /><span class="text-brass-light">unique human</span> stands behind this.
          </h1>
          <p class="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-paper-dim">
            Not AI detection — that is impossible. A verified, unique person privately vouches for a
            piece of content: anonymous, sybil-resistant, and proven on Stellar with a real
            zero-knowledge proof generated in your browser.
          </p>
        </div>
        <div class="order-1 flex h-[320px] w-[320px] items-center justify-center lg:order-2">
          <ClientOnly>
            <VouchSeal :size="320" :hash="vResult ? '0x' + (vResult.hash.slice(0,8)) : '0x9F4C·A1B2'"
                       :label="vResult ? 'Vouched' : 'Attestation'" />
          </ClientOnly>
        </div>
      </section>

      <!-- interactive: vouch + verify -->
      <section class="grid border-t border-ink-600 lg:grid-cols-2">
        <!-- VOUCH -->
        <div class="border-b border-ink-600 px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r">
          <p class="eyebrow text-brass">Vouch for content</p>
          <p class="mt-3 text-sm text-paper-dim">A verified human stakes a private, anonymous vouch on this content.</p>

          <label class="mt-5 block font-mono text-xs text-paper-faint">YOUR VERIFIED IDENTITY (demo registry)</label>
          <select v-model="memberId" class="mt-1.5 w-full rounded-sm border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-paper">
            <option v-for="m in registry?.members || []" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>

          <label class="mt-4 block font-mono text-xs text-paper-faint">CONTENT (a full article)</label>
          <textarea v-model="content" rows="6"
            class="mt-1.5 w-full resize-none rounded-sm border border-ink-600 bg-ink-800 px-3 py-2 text-sm leading-relaxed text-paper" />

          <button :disabled="vBusy"
            class="mt-4 w-full rounded-sm border border-brass bg-brass/10 px-5 py-3 text-sm font-medium tracking-wide text-brass-light transition hover:bg-brass/20 disabled:opacity-50"
            @click="doVouch">
            {{ vBusy ? "Working…" : "Generate proof & vouch on Stellar" }}
          </button>

          <p v-if="vStatus" class="mt-3 font-mono text-xs text-prussian-light">{{ vStatus }}</p>
          <p v-if="vErr" class="mt-3 font-mono text-xs text-oxblood">⚠ {{ vErr }}</p>
          <div v-if="vResult" class="mt-4 rounded-sm border border-brass/30 bg-brass/5 p-4 text-sm">
            <p class="text-brass-light">✅ Vouched on-chain · <span class="text-paper">{{ vResult.count }}</span> unique human(s) for this content</p>
            <a :href="`https://stellar.expert/explorer/testnet/tx/${vResult.hash}`" target="_blank"
               class="mt-1 block break-all font-mono text-xs text-prussian-light underline">view the real transaction ↗</a>
          </div>
        </div>

        <!-- VERIFY -->
        <div class="px-6 py-8 sm:px-10">
          <p class="eyebrow text-paper-dim">Verify a post</p>
          <p class="mt-3 text-sm text-paper-dim">Anyone can check how many unique verified humans stand behind a piece of content.</p>

          <label class="mt-5 block font-mono text-xs text-paper-faint">PASTE CONTENT (blank = use the one on the left)</label>
          <textarea v-model="vcontent" rows="3" placeholder="Paste the article / post text…"
            class="mt-1.5 w-full resize-none rounded-sm border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-paper placeholder:text-paper-faint" />

          <button :disabled="verBusy"
            class="mt-4 w-full rounded-sm border border-ink-600 px-5 py-3 text-sm font-medium tracking-wide text-paper-dim transition hover:border-paper-dim hover:text-paper disabled:opacity-50"
            @click="doVerify">
            {{ verBusy ? "Checking…" : "Check vouches on Stellar" }}
          </button>

          <p v-if="verErr" class="mt-3 font-mono text-xs text-oxblood">⚠ {{ verErr }}</p>
          <div v-if="verCount !== null" class="mt-4 rounded-sm border border-ink-600 p-4">
            <p class="font-display text-3xl text-paper">{{ verCount }}</p>
            <p class="mt-1 text-sm text-paper-dim">unique verified human(s) vouch for this exact content · anonymous · on Stellar</p>
          </div>
        </div>
      </section>

      <!-- for agents: x402 -->
      <section class="border-t border-ink-600 px-6 py-8 sm:px-10">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="eyebrow text-brass">For agents · x402</p>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-paper-dim">
              The real shift: an AI agent can ask, programmatically, <em>"does a real human stand behind
              this content?"</em> — pay a micropayment over <span class="text-paper">x402</span> (HTTP 402),
              and get a verifiable, on-chain answer. HumanVouch as infrastructure for the agent era.
            </p>
          </div>
          <button :disabled="agentBusy"
            class="rounded-sm border border-brass bg-brass/10 px-4 py-2.5 text-sm font-medium text-brass-light transition hover:bg-brass/20 disabled:opacity-50"
            @click="runAgentQuery">
            {{ agentBusy ? "Querying…" : "Run an agent query" }}
          </button>
        </div>

        <pre class="mt-5 overflow-x-auto rounded-sm border border-ink-600 bg-ink-800 p-4 font-mono text-xs text-paper-dim"><span class="text-paper-faint"># an agent asks if a human backs this article</span>
curl <span class="text-prussian-light">/api/v1/attestation?content=…</span></pre>

        <div v-if="agentErr" class="mt-3 font-mono text-xs text-oxblood">⚠ {{ agentErr }}</div>

        <div v-if="agent402" class="mt-4 grid gap-3 lg:grid-cols-2">
          <div>
            <p class="font-mono text-xs text-oxblood">← {{ agent402.status }} Payment Required (x402)</p>
            <pre class="mt-1.5 overflow-x-auto rounded-sm border border-ink-600 bg-ink-800 p-3 font-mono text-[11px] leading-relaxed text-paper-dim">{{ JSON.stringify(agent402.body, null, 2) }}</pre>
          </div>
          <div v-if="agent200">
            <p class="font-mono text-xs text-brass-light">← {{ agent200.status }} OK · paid · resolved on-chain</p>
            <pre class="mt-1.5 overflow-x-auto rounded-sm border border-brass/30 bg-brass/5 p-3 font-mono text-[11px] leading-relaxed text-paper">{{ JSON.stringify(agent200.body, null, 2) }}</pre>
          </div>
        </div>
      </section>

      <!-- honest framing -->
      <section class="grid border-t border-ink-600 sm:grid-cols-2">
        <div class="border-b border-ink-600 px-6 py-6 sm:border-b-0 sm:border-r sm:px-10">
          <p class="eyebrow text-brass">What it proves</p>
          <ul class="mt-4 space-y-2 text-sm text-paper">
            <li class="flex gap-3"><span class="text-brass">—</span> A unique verified human vouches, anonymously</li>
            <li class="flex gap-3"><span class="text-brass">—</span> Sybil-resistant: one human, one vouch per content</li>
            <li class="flex gap-3"><span class="text-brass">—</span> Real Groth16 proof, verified on Stellar</li>
          </ul>
        </div>
        <div class="px-6 py-6 sm:px-10">
          <p class="eyebrow text-paper-faint">What it does not claim</p>
          <ul class="mt-4 space-y-2 text-sm text-paper-dim">
            <li class="flex gap-3"><span class="text-paper-faint">—</span> That a human <em>wrote</em> the bytes (attribution, not authorship)</li>
            <li class="flex gap-3"><span class="text-paper-faint">—</span> AI detection — unreliable and evadable</li>
            <li class="flex gap-3"><span class="text-paper-faint">—</span> Anything stronger than the personhood registry behind it</li>
          </ul>
        </div>
      </section>

      <footer class="border-t border-ink-600 px-6 py-5 font-mono text-xs text-paper-faint sm:px-10">
        Live on Stellar testnet · AttestContract {{ cfg.attestContractId.slice(0, 6) }}… · demo personhood registry (real crypto, operated by us) · non-production trusted setup
      </footer>
    </div>
  </div>
</template>
