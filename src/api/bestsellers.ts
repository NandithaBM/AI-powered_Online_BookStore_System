import axios from 'axios';

export const fetchBestsellers = async () => {
  const res = await axios.get('/books/bestsellers');
  return res.data;
}; 