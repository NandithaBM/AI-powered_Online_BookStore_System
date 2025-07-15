import React, { useState } from 'react';
import { analyzeSentiment } from '../api/sentiment';

const ReviewSentiment: React.FC = () => {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState<{label: string, score: number} | null>(null);

  const handleAnalyze = async () => {
    try {
      const result = await analyzeSentiment(text);
      setSentiment(result);
    } catch {
      alert('Sentiment analysis failed');
    }
  };

  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your review..." />
      <button onClick={handleAnalyze}>Analyze Sentiment</button>
      {sentiment && (
        <div>
          <b>Sentiment:</b> {sentiment.label} ({(sentiment.score * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  );
};

export default ReviewSentiment; 