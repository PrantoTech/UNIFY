import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, Search, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Library = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API}/library/books`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (bookId) => {
    try {
      await axios.post(`${API}/library/borrow/${bookId}`);
      toast.success('Book borrowed successfully!');
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to borrow book');
    }
  };

  const handleReturn = async (bookId) => {
    try {
      await axios.post(`${API}/library/return/${bookId}`);
      toast.success('Book returned successfully!');
      fetchBooks();
    } catch (error) {
      toast.error('Failed to return book');
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(books.map(b => b.category))];

  return (
    <div className="space-y-6" data-testid="library-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit']">Library Services</h1>
          <p className="text-muted-foreground">Browse and borrow books from our collection</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="search-books"
          />
        </div>
      </div>

      {/* Library Info */}
      <Card className="glass-card bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500 text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Library Timings</h3>
              <p className="text-sm text-muted-foreground">
                Weekdays: 9:00 AM - 8:00 PM | Saturday: 10:00 AM - 5:00 PM | Sunday: Closed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {categories.map(category => {
            const categoryBooks = filteredBooks.filter(b => b.category === category);
            if (categoryBooks.length === 0) return null;
            
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold font-['Outfit'] mb-4">{category}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryBooks.map((book) => (
                    <Card key={book.id} className="glass-card" data-testid={`book-${book.id}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-16 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-2">{book.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
                            <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Badge variant={book.borrowed_by ? 'secondary' : 'outline'}>
                            {book.borrowed_by ? 'Borrowed' : 'Available'}
                          </Badge>
                          {book.borrowed_by === user?.id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => handleReturn(book.id)}
                              data-testid={`return-book-${book.id}`}
                            >
                              Return
                            </Button>
                          ) : !book.borrowed_by ? (
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleBorrow(book.id)}
                              data-testid={`borrow-book-${book.id}`}
                            >
                              Borrow
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default Library;
