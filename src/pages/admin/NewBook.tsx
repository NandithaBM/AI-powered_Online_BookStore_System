import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const NewBook = () => {
  const navigate = useNavigate();
  const [book, setBook] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    genre: '',
    language: '',
    publisher: '',
    publishedDate: '',
    pageCount: '',
    format: 'paperback',
    price: '',
    coverImage: '',
    stock: '',
    isActive: true,
    isFeatured: false,
    isNewRelease: false,
  });

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const target = e.target;

  const { name, type, value } = target;

  if (type === 'checkbox') {
    const checked = (target as HTMLInputElement).checked;
    setBook((prev) => ({
      ...prev,
      [name]: checked,
    }));
  } else {
    setBook((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...book,
        pageCount: parseInt(book.pageCount),
        price: parseFloat(book.price),
        stock: parseInt(book.stock),
        publishedDate: new Date(book.publishedDate),
        genre: [book.genre],
        ratings: { average: 0, count: 0 },
        inventory: {
          stock: parseInt(book.stock),
          sold: 0,
        },
        tags: [],
        keywords: [],
        themes: [],
        metadata: {},
      };

      await axios.post('/admin/books', payload);
      toast.success('Book added successfully');
      navigate('/admin/books');
    } catch (error) {
      console.error('Add book error:', error);
      toast.error('Failed to add book');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Book</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-gray-700 font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={book.title}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Author</label>
            <input
              type="text"
              name="author"
              value={book.author}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">ISBN</label>
            <input
              type="text"
              name="isbn"
              value={book.isbn}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={book.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Genre</label>
            <input
              type="text"
              name="genre"
              value={book.genre}
              onChange={handleChange}
              placeholder="e.g. Thriller"
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Language</label>
            <input
              type="text"
              name="language"
              value={book.language}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Publisher</label>
            <input
              type="text"
              name="publisher"
              value={book.publisher}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Published Date</label>
            <input
              type="date"
              name="publishedDate"
              value={book.publishedDate}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Page Count</label>
              <input
                type="number"
                name="pageCount"
                value={book.pageCount}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={book.price}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Cover Image URL</label>
            <input
              type="text"
              name="coverImage"
              value={book.coverImage}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Format</label>
            <select
              name="format"
              value={book.format}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="paperback">Paperback</option>
              <option value="hardcover">Hardcover</option>
              <option value="ebook">eBook</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              value={book.stock}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col space-y-2 mt-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={book.isActive}
                onChange={handleChange}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Active</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={book.isFeatured}
                onChange={handleChange}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Featured</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="isNewRelease"
                checked={book.isNewRelease}
                onChange={handleChange}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Mark as New Release</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors mt-6"
          >
            Add Book
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewBook;
