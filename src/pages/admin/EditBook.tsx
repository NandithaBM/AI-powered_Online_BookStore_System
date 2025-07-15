import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBook();
  }, []);

  const fetchBook = async () => {
    try {
      const response = await axios.get(`/admin/books`);
      const found = response.data.books.find((b: any) => b._id === id);
      if (!found) throw new Error('Book not found');
      setBook(found);
    } catch (err) {
      console.error('Error loading book:', err);
      toast.error('Failed to load book');
      navigate('/admin/books');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? Number(value) : value;
    setBook({ ...book, [name]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/admin/books/${id}`, book);
      toast.success('Book updated');
      navigate('/admin/books');
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update book');
    }
  };

  if (loading || !book) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Book</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="title" value={book.title} onChange={handleChange} placeholder="Title" className="w-full border p-2 rounded" required />
        <input type="text" name="author" value={book.author} onChange={handleChange} placeholder="Author" className="w-full border p-2 rounded" required />
        <input type="text" name="isbn" value={book.isbn} onChange={handleChange} placeholder="ISBN" className="w-full border p-2 rounded" required />
        <input type="number" name="price" value={book.price} onChange={handleChange} placeholder="Price" className="w-full border p-2 rounded" required />
        <input type="text" name="coverImage" value={book.coverImage} onChange={handleChange} placeholder="Cover Image URL" className="w-full border p-2 rounded" required />
        <textarea name="description" value={book.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" rows={4} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Update Book</button>
      </form>
    </div>
  );
};

export default EditBook;
