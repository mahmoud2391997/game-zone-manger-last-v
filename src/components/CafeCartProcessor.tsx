
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon } from 'lucide-react';
import { processCafeCart } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CafeCartProcessorProps {
  cafeProducts: any[];
  onOrderProcessed?: () => void;
}

const CafeCartProcessor = ({ cafeProducts, onOrderProcessed }: CafeCartProcessorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const processOrder = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter customer name",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await processCafeCart(customerName.trim(), cart, paymentMethod);
      
      toast({
        title: "Success",
        description: "Order processed successfully!",
      });

      // Reset form
      setCart([]);
      setCustomerName('');
      setPaymentMethod('cash');
      setIsOpen(false);
      
      if (onOrderProcessed) {
        onOrderProcessed();
      }
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Error",
        description: "Failed to process order",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <ShoppingCartIcon className="w-4 h-4 mr-2" />
          Process Cafe Order
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cafe Order Processing</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Products</h3>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {cafeProducts.filter(p => p.active && p.stock > 0).map((product) => (
                <Card key={product.id} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-300">
                          {product.price} EGP • Stock: {product.stock}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addToCart(product)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shopping Cart</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'transfer') => setPaymentMethod(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="cash" className="text-white">Cash</SelectItem>
                    <SelectItem value="card" className="text-white">Card</SelectItem>
                    <SelectItem value="transfer" className="text-white">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <Card key={item.id} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-300">
                          {item.price} EGP each
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <MinusIcon className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <PlusIcon className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {cart.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                Cart is empty
              </div>
            )}

            {cart.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-400">{getTotalAmount().toFixed(2)} EGP</span>
                </div>
                
                <Button 
                  onClick={processOrder}
                  disabled={isProcessing || cart.length === 0 || !customerName.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? 'Processing...' : 'Process Order'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CafeCartProcessor;
