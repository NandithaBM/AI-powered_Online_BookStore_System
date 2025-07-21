import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';
import BookCard from '../components/BookCard';
import toast from 'react-hot-toast';

interface Book {
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
}

interface Filters {
  search: string;
  genre: string[];
  minPrice: string;
  maxPrice: string;
  minRating: string;
  format: string[];
  sortBy: string;
  sortOrder: string;
}

const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || '',
    genre: [],
    minPrice: '',
    maxPrice: '',
    minRating: '',
    format: [],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [genres, setGenres] = useState<string[]>([]);
  const formats = ['hardcover', 'paperback', 'ebook', 'audiobook'];

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [searchParams]);

  const fetchGenres = async () => {
    try {
      const response = await axios.get('/books/meta/genres');
      setGenres(response.data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const response = await axios.get(`/books?${params.toString()}`);
      setBooks(response.data.books);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Error loading books');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value.length > 0) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value.toString());
        }
      }
    });

    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      genre: [],
      minPrice: '',
      maxPrice: '',
      minRating: '',
      format: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearchParams({});
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Browse Books</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{pagination.total} books found</p>
          </div>

          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-sm border p-6 sticky top-24`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search books..."
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genre
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {genres.map((genre) => (
                    <label key={genre} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.genre.includes(genre)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('genre', [...filters.genre, genre]);
                          } else {
                            handleFilterChange('genre', filters.genre.filter(g => g !== genre));
                          }
                        }}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="Min"
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Max"
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format
                </label>
                <div className="space-y-2">
                  {formats.map((format) => (
                    <label key={format} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.format.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('format', [...filters.format, format]);
                          } else {
                            handleFilterChange('format', filters.format.filter(f => f !== format));
                          }
                        }}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="ratings.average-desc">Highest Rated</option>
                  <option value="title-asc">Title: A to Z</option>
                  <option value="title-desc">Title: Z to A</option>
                </select>
              </div>

              <button
                onClick={applyFilters}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Books Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No books found matching your criteria.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear filters to see all books
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {books.map((book) => (
                    <div key={book._id} className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow p-4 ${viewMode === 'list' ? 'col-span-1 w-full' : ''}`}>
                      <BookCard book={book} viewMode={viewMode} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center mt-12">
                    <nav className="flex space-x-2">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-md ${
                            page === pagination.current
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Books;