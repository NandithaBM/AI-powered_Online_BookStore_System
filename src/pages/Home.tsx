import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';
import BookCard from '../components/BookCard';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { fetchBestsellers } from '../api/bestsellers';
import { fetchPersonalizedRecommendations } from '../api/personalizedRecommendations';

interface Book {
  _id?: string;
  id?: string;
  title: string;
  author: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  coverImage: string;
  ratings?: {
    average: number;
    count: number;
  };
  genre: string[];
  format?: string;
  explanation?: string;
}

const Home = () => {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  const [bestsellers, setBestsellers] = useState<Book[]>([]);
  const [personalized, setPersonalized] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [featuredRes, newReleasesRes, bestsellersData] = await Promise.all([
        axios.get('/books/featured'),
        axios.get('/books/new-releases'),
        fetchBestsellers(),
      ]);

      setFeaturedBooks(featuredRes.data);
      setNewReleases(newReleasesRes.data);
      setBestsellers(bestsellersData);
    } catch (error) {
      console.error('Error fetching home data:', error);
      toast.error('Error loading books');
    } finally {
      setLoading(false);
    }
  };

  // Fetch personalized recommendations only if logged in
  useEffect(() => {
    if (user) {
      fetchPersonalizedRecommendations()
        .then((recs) => setPersonalized(recs || []))
        .catch((err) =>
          console.error('Failed to load personalized books', err)
        );
    }
  }, [user]);

  const stats = [
    { icon: BookOpen, label: 'Books Available', value: '100+' },
    { icon: Users, label: 'Happy Readers', value: '100+' },
    { icon: Award, label: 'Award Winners', value: '50+' },
    { icon: TrendingUp, label: 'New This Week', value: '25+' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  console.log('Personalized recommendations:', personalized);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6">
              Discover Your Next
              <span className="block text-accent-400">Literary Adventure</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              AI-powered recommendations, semantic search, and personalized book discovery
              await you in our vast digital library.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/books"
                className="bg-accent-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-accent-600 transition-colors inline-flex items-center justify-center"
              >
                Explore Books
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-primary-800 transition-colors"
              >
                Join BookVault
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-12 w-12 text-primary-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <Section title="Featured Books" subtitle="Handpicked selections from our curators" link="/books?featured=true" books={featuredBooks} />

      {/* New Releases */}
      <Section title="New Releases" subtitle="Latest additions to our collection" link="/books?new=true" books={newReleases} />

      {/* Bestsellers */}
      <Section title="Bestsellers" subtitle="Most popular books among our readers" link="/books?bestseller=true" books={bestsellers} />

      {/* Personalized Recommendations */}
      {user && personalized.length > 0 && (
  <section className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Recommended For You</h2>
                <p className="text-gray-600">Because you liked similar books and genres</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {personalized.map(book => (
                <div key={book._id || book.id}>
                  <BookCard book={book} />
                  {book.explanation && (
                    <div className="text-xs text-gray-500 mt-1">{book.explanation}</div>
                  )}
                </div>
        ))}
      </div>
    </div>
  </section>
)}


      {/* AI Features */}
      <section className="py-16 bg-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <Sparkles className="inline h-8 w-8 mr-2 text-accent-400" />
              AI-Powered Book Discovery
            </h2>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Experience the future of book discovery with our intelligent recommendation system
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Your Reading Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of readers who trust BookVault for their literary adventures.
          </p>
          <Link
            to="/register"
            className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors inline-flex items-center"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

// Small reusable component
const Section = ({
  title,
  subtitle,
  link,
  books,
}: {
  title: string;
  subtitle: string;
  link: string;
  books: Book[];
}) => (
  <section className="py-16 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <Link
          to={link}
          className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center"
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.slice(0, 4).map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
    </div>
  </section>
);
