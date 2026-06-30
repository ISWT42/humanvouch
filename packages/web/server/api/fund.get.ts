// Fund a freshly-created testnet wallet via Friendbot (server-side, no CORS).
export default defineEventHandler(async (event) => {
  const addr = String(getQuery(event).addr ?? "");
  if (!/^G[A-Z2-7]{55}$/.test(addr)) {
    setResponseStatus(event, 400);
    return { error: "invalid address" };
  }
  const r = await fetch(`https://friendbot.stellar.org/?addr=${addr}`);
  if (!r.ok) {
    setResponseStatus(event, 502);
    return { error: "friendbot funding failed", status: r.status };
  }
  return { funded: true, address: addr };
});
