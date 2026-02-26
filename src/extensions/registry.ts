import type { Source, SourceIdentifier } from "./types";

const sources = new Map<string, Source>();

/**
 * Register a source extension. Called at module scope by each extension.
 * Throws if a source with the same ID is already registered.
 */
export function registerSource(source: Source): void {
  if (sources.has(source.id)) {
    throw new Error(`Source "${source.id}" is already registered`);
  }
  sources.set(source.id, source);
}

/** Get a registered source by ID. */
export function getSource(id: string): Source | undefined {
  return sources.get(id);
}

/** Get all registered sources. */
export function getAllSources(): Source[] {
  return Array.from(sources.values());
}

/**
 * Try to identify which source a URL belongs to.
 * Tests each registered source's `parseUrl` and returns the first match.
 */
export function identifySource(url: string): SourceIdentifier | null {
  for (const source of sources.values()) {
    const result = source.parseUrl(url);
    if (result) return result;
  }
  return null;
}

/**
 * Check if an image URL belongs to any registered source's allowed domains.
 * Returns the matching source for header lookup, or undefined if no match.
 */
export function validateImageDomain(
  imageUrl: string,
): { valid: boolean; source?: Source } {
  try {
    const parsed = new URL(imageUrl);
    for (const source of sources.values()) {
      const isAllowed = source.imageDomains.some(
        (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`),
      );
      if (isAllowed) return { valid: true, source };
    }
  } catch {
    // Invalid URL
  }
  return { valid: false };
}

/**
 * Find the first source that recognizes any URL in a list of external links.
 * Designed to work with AniList's `externalLinks` array.
 */
export function findSourceLink(
  externalLinks: { url: string }[] | null | undefined,
): SourceIdentifier | null {
  if (!externalLinks) return null;
  for (const link of externalLinks) {
    const id = identifySource(link.url);
    if (id) return id;
  }
  return null;
}
