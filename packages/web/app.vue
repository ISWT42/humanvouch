<script setup lang="ts">
// HumanVouch landing — a "certificate of authenticity" for digital content.
// The guilloché seal carries the brand; everything around it stays quiet.
const steps = [
  {
    n: "I",
    title: "Enroll once",
    body: "A verified, unique person joins the personhood registry a single time. That's the only moment identity is involved.",
  },
  {
    n: "II",
    title: "Vouch",
    body: "They privately sign a piece of content. A zero-knowledge proof is minted to Stellar — their identity never leaves their device.",
  },
  {
    n: "III",
    title: "Verify",
    body: "Anyone checks the seal: a real, unique human stands behind this content, and can't have done so twice. Nobody learns who.",
  },
];
</script>

<template>
  <div class="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
    <!-- security-document frame -->
    <div class="relative mx-auto max-w-doc border border-ink-600">
      <span class="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-brass/60" />
      <span class="pointer-events-none absolute right-2 top-2 h-2 w-2 border-r border-t border-brass/60" />
      <span class="pointer-events-none absolute bottom-2 left-2 h-2 w-2 border-b border-l border-brass/60" />
      <span class="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b border-r border-brass/60" />

      <!-- masthead -->
      <header class="flex items-center justify-between border-b border-ink-600 px-6 py-4 sm:px-10">
        <div class="flex items-baseline gap-2.5">
          <span class="font-display text-xl font-semibold tracking-tight text-paper">HumanVouch</span>
        </div>
        <p class="eyebrow hidden sm:block">Issued on Stellar · Verified on-chain</p>
      </header>

      <!-- hero -->
      <section class="grid items-center gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:py-20">
        <div class="order-2 lg:order-1">
          <p class="eyebrow">Real-World ZK · Stellar</p>
          <h1 class="mt-5 font-display text-[2.6rem] font-normal leading-[1.04] tracking-[-0.01em] text-paper sm:text-6xl">
            Proof that a real,<br />
            <span class="text-brass-light">unique human</span><br />
            stands behind this.
          </h1>
          <p class="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-paper-dim">
            Not AI detection — that is impossible. HumanVouch lets a verified, unique person
            privately vouch for a piece of content: anonymous, sybil-resistant, and provable
            on Stellar with zero-knowledge. A certificate of authenticity for the human era.
          </p>

          <div class="mt-9 flex flex-wrap gap-3">
            <button
              class="rounded-sm border border-brass bg-brass/10 px-5 py-3 text-sm font-medium tracking-wide text-brass-light transition hover:bg-brass/20"
            >
              Vouch for content
            </button>
            <button
              class="rounded-sm border border-ink-600 px-5 py-3 text-sm font-medium tracking-wide text-paper-dim transition hover:border-paper-dim hover:text-paper"
            >
              Verify a post
            </button>
          </div>
        </div>

        <div class="order-1 flex justify-center lg:order-2">
          <VouchSeal :size="380" hash="0x9F4C·A1B2" label="Attestation" />
        </div>
      </section>

      <!-- the ledger: what it proves / what it does not claim -->
      <section class="grid border-t border-ink-600 sm:grid-cols-2">
        <div class="border-b border-ink-600 px-6 py-8 sm:border-b-0 sm:border-r sm:px-10">
          <p class="eyebrow text-brass">What the seal proves</p>
          <ul class="mt-5 space-y-3 text-sm leading-relaxed text-paper">
            <li class="flex gap-3"><span class="text-brass">—</span> A unique verified human vouches for the content</li>
            <li class="flex gap-3"><span class="text-brass">—</span> Anonymous: nobody learns who, not even us</li>
            <li class="flex gap-3"><span class="text-brass">—</span> Sybil-resistant: one human, one vouch per content</li>
            <li class="flex gap-3"><span class="text-brass">—</span> Verified on-chain on Stellar / Soroban</li>
          </ul>
        </div>
        <div class="px-6 py-8 sm:px-10">
          <p class="eyebrow text-paper-faint">What it does not claim</p>
          <ul class="mt-5 space-y-3 text-sm leading-relaxed text-paper-dim">
            <li class="flex gap-3"><span class="text-paper-faint">—</span> That a human <em>wrote</em> the bytes — it is attribution, not authorship</li>
            <li class="flex gap-3"><span class="text-paper-faint">—</span> AI detection — statistically unreliable and evadable</li>
            <li class="flex gap-3"><span class="text-paper-faint">—</span> Anything stronger than the personhood registry behind it</li>
          </ul>
        </div>
      </section>

      <!-- how a vouch is issued — a real, ordered sequence, so it earns its numerals -->
      <section class="border-t border-ink-600 px-6 py-12 sm:px-10">
        <p class="eyebrow">How a vouch is issued</p>
        <ol class="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          <li v-for="s in steps" :key="s.n" class="border-t border-ink-700 pt-5">
            <span class="font-mono text-sm text-brass">{{ s.n }}</span>
            <h3 class="mt-2 font-display text-xl text-paper">{{ s.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-paper-dim">{{ s.body }}</p>
          </li>
        </ol>
      </section>

      <!-- colophon -->
      <footer class="flex flex-col gap-2 border-t border-ink-600 px-6 py-5 text-xs text-paper-faint sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span class="font-mono">127.0.0.1:58273 · local specimen</span>
        <span class="font-mono">Demo trusted-setup is non-production · branding in progress</span>
      </footer>
    </div>
  </div>
</template>
