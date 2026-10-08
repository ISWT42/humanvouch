export async function resolveShareView(hashField, fetchVouchesFn, getStoredContentFn) {
  try {
    const rawCount = await fetchVouchesFn(hashField);
    const count = Number(rawCount) || 0;
    const content = getStoredContentFn ? getStoredContentFn(hashField) : null;
    return {
      loading: false,
      hashField,
      count,
      content,
      error: null,
      failed: false,
    };
  } catch (e) {
    let msg = "On-chain attestation resolution failed";
    if (e && typeof e === "object" && typeof e.message === "string" && e.message.trim()) {
      msg = e.message.trim();
    } else if (typeof e === "string" && e.trim()) {
      msg = e.trim();
    }
    return {
      loading: false,
      hashField,
      count: null,
      content: null,
      error: msg,
      failed: true,
    };
  }
}
