import axios from 'axios';

export const fetchPersonalizedRecommendations = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get('/recommendations/personalized-recommendations', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.recommendations;
}; 