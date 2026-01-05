import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { UtensilsCrossed, ShoppingCart, Plus, Minus, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Canteen = () => {
  const { user } = useAuth();
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, ordersRes] = await Promise.all([
        axios.get(`${API}/canteen/menu`),
        axios.get(`${API}/canteen/orders`),
      ]);
      setMenu(menuRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(c => {
      if (c.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.id !== itemId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setOrdering(true);
    try {
      await axios.post(`${API}/canteen/orders`, {
        items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
        total_amount: getTotalAmount(),
      });
      toast.success('Order placed successfully!');
      setCart([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setOrdering(false);
    }
  };

  const categories = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'combo', label: 'Combos' },
    { key: 'dinner', label: 'Dinner' },
  ];

  const getMenuByCategory = (category) => menu.filter(m => m.category === category);

  return (
    <div className="space-y-6" data-testid="canteen-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit']">Canteen Menu</h1>
          <p className="text-muted-foreground">Order delicious food from campus canteen</p>
        </div>
        {cart.length > 0 && (
          <Badge variant="default" className="text-lg px-4 py-2">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {cart.reduce((sum, c) => sum + c.quantity, 0)} items • ₹{getTotalAmount()}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="breakfast">
              <TabsList className="grid grid-cols-4 w-full">
                {categories.map(cat => (
                  <TabsTrigger key={cat.key} value={cat.key}>{cat.label}</TabsTrigger>
                ))}
              </TabsList>
              {categories.map(cat => (
                <TabsContent key={cat.key} value={cat.key} className="mt-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {getMenuByCategory(cat.key).map((item) => (
                      <Card key={item.id} className="glass-card overflow-hidden" data-testid={`menu-item-${item.id}`}>
                        <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20">
                          {item.image_url && (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <Badge variant="secondary">₹{item.price}</Badge>
                          </div>
                          <Button
                            size="sm"
                            className="w-full rounded-full mt-2"
                            onClick={() => addToCart(item)}
                            disabled={!item.available}
                            data-testid={`add-to-cart-${item.id}`}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Cart & Orders */}
          <div className="space-y-6">
            {/* Cart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" /> Your Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Cart is empty</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between font-semibold mb-3">
                        <span>Total</span>
                        <span>₹{getTotalAmount()}</span>
                      </div>
                      <Button
                        className="w-full rounded-full"
                        onClick={handlePlaceOrder}
                        disabled={ordering}
                        data-testid="place-order-btn"
                      >
                        {ordering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Place Order
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit']">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No orders yet</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-3 rounded-lg bg-secondary/50">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant={order.status === 'completed' ? 'default' : 'outline'}>
                            {order.status}
                          </Badge>
                          <span className="text-sm font-semibold">₹{order.total_amount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canteen;
