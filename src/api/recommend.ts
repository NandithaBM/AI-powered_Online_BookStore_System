export async function getRecommendations(book_id: string, limit: number = 5) {
  const res = await fetch(`/api/recommend?book_id=${encodeURIComponent(book_id)}&limit=${limit}`);
  if (!res.ok) throw new Error('Recommendation failed');
  return res.json();
} 