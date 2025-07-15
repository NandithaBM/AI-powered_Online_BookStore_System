export async function semanticSearch(query: string, limit: number = 10) {
  const res = await fetch(`/api/semantic-search?query=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error('Semantic search failed');
  return res.json();
} 