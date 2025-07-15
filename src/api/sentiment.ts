export async function analyzeSentiment(text: string) {
  const res = await fetch('/api/sentiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Sentiment analysis failed');
  return res.json();
} 