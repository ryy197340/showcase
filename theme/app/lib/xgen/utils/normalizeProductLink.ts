export function normalizeProductLink(link: string) {
  try {
    const url = new URL(link);
    return url.pathname + url.search;
  } catch (error) {
    console.error('Error normalizing product link', error);
    return link;
  }
}
