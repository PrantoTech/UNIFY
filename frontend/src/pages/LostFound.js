import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Search, Plus, MapPin, Phone, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LostFound = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: '',
    description: '',
    location: '',
    contact: '',
    item_type: 'found',
    image_url: ''
  });
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API}/lost-found`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.item_name || !newItem.description) {
      toast.error('Please fill required fields');
      return;
    }
    setCreating(true);
    try {
      const response = await axios.post(`${API}/lost-found`, newItem);
      setItems([response.data, ...items]);
      setShowCreateDialog(false);
      setNewItem({ item_name: '', description: '', location: '', contact: '', item_type: 'found', image_url: '' });
      toast.success('Item reported successfully!');
    } catch (error) {
      toast.error('Failed to report item');
    } finally {
      setCreating(false);
    }
  };

  const handleMarkResolved = async (itemId) => {
    try {
      await axios.put(`${API}/lost-found/${itemId}/status?status=resolved`);
      setItems(items.map(i => i.id === itemId ? { ...i, status: 'resolved' } : i));
      toast.success('Item marked as resolved');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'lost') return item.item_type === 'lost';
    if (filter === 'found') return item.item_type === 'found';
    return true;
  });

  return (
    <div className="space-y-6" data-testid="lost-found-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit']">Lost & Found</h1>
          <p className="text-muted-foreground">Report or find lost items on campus</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full" data-testid="report-item-btn">
              <Plus className="h-4 w-4 mr-2" /> Report Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Lost/Found Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select
                  value={newItem.item_type}
                  onValueChange={(v) => setNewItem({ ...newItem, item_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">I Lost Something</SelectItem>
                    <SelectItem value="found">I Found Something</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  placeholder="e.g., Blue Wallet, Sunglasses"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the item in detail..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Where was it lost/found?"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input
                  placeholder="How to reach you?"
                  value={newItem.contact}
                  onChange={(e) => setNewItem({ ...newItem, contact: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateItem} className="w-full rounded-full" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="rounded-full"
        >
          All Items
        </Button>
        <Button
          variant={filter === 'lost' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('lost')}
          className="rounded-full"
        >
          Lost
        </Button>
        <Button
          variant={filter === 'found' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('found')}
          className="rounded-full"
        >
          Found
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground">No lost or found items have been reported yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="glass-card" data-testid={`lost-found-item-${item.id}`}>
              {item.image_url && (
                <div className="h-32 bg-secondary">
                  <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{item.item_name}</h3>
                  <Badge variant={item.item_type === 'lost' ? 'destructive' : 'default'}>
                    {item.item_type === 'lost' ? 'Lost' : 'Found'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                {item.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </div>
                )}
                {item.contact && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Phone className="h-4 w-4" />
                    {item.contact}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">By {item.reporter_name}</span>
                  {item.status === 'active' && item.reporter_id === user?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => handleMarkResolved(item.id)}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  {item.status === 'resolved' && (
                    <Badge variant="secondary">Resolved</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LostFound;
