/**
 * The single seam every rendered product link passes through. Today this
 * is a pure pass-through — no affiliate program is wired up yet. Once one
 * is, tag-injection (e.g. appending Amazon's `?tag=...`) happens here and
 * only here, so every link added before that point starts earning
 * commission automatically — the raw URL is what's stored, this function
 * is what's rendered.
 */
export function getProductLink(url: string | null): string | null {
  return url;
}

/** The bare hostname of a product link (e.g. "amazon.com"), for display next to the link itself. */
export function getProductDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
