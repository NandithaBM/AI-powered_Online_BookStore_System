export interface SearchResult {
  _id: string;
  title: string;
  author: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  coverImage: string;
  ratings: {
    average: number;
    count: number;
  };
  genre: string[];
  format: string;
  stock: number; // If needed
  relevanceScore?: number;
  
}
