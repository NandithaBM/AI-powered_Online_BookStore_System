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
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-lg shadow">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your review..." className="w-full p-2 rounded border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2" />
      <button onClick={handleAnalyze} className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors mb-2">Analyze Sentiment</button>
      {sentiment && (
        <div className="mt-2 p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
          <b>Sentiment:</b> {sentiment.label} ({(sentiment.score * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  );
};

export default ReviewSentiment; 