
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogInIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', role: 'cashier' });
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onAuthSuccess();
      }
    };
    checkAuth();

    // Load saved credentials from sessionStorage
    const savedCredentials = sessionStorage.getItem('gaming_center_credentials');
    if (savedCredentials) {
      try {
        const { email, role } = JSON.parse(savedCredentials);
        setLoginForm(prev => ({ ...prev, email, role }));
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    }
  }, [onAuthSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;

      const userId = data.user?.id;
      console.log('User ID:', userId);

      // Try to fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // If profile is missing, create it with the selected role
      if (profileError && (profileError.code === 'PGRST116' || profileError.code === 'PGRST107')) {
        console.log('Profile not found, creating new profile with role:', loginForm.role);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: loginForm.email,
            role: loginForm.role,
          });

        if (insertError) {
          console.error('Profile creation error:', insertError);
          throw new Error("Failed to create user profile: " + insertError.message);
        }

        // Use the role from the form since we just created the profile
        const finalRole = loginForm.role;
        
        // Save credentials to sessionStorage (without password)
        sessionStorage.setItem('gaming_center_credentials', JSON.stringify({
          email: loginForm.email,
          role: finalRole
        }));

        toast({
          title: "Success",
          description: `Logged in as ${finalRole}`,
        });

        onAuthSuccess();
        return;
      }

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to fetch user profile: ' + profileError.message);
      }

      // Check if the user's role matches what they selected
      if (profile.role !== loginForm.role) {
        await supabase.auth.signOut();
        throw new Error(`Access denied. You don't have ${loginForm.role} privileges. Your role is: ${profile.role}`);
      }

      // Save credentials to sessionStorage (without password)
      sessionStorage.setItem('gaming_center_credentials', JSON.stringify({
        email: loginForm.email,
        role: profile.role
      }));

      toast({
        title: "Success",
        description: `Logged in as ${profile.role}`,
      });

      onAuthSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Zone 14 Gaming Center</CardTitle>
          <p className="text-gray-400">Sign in to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="role" className="text-white">Role</Label>
              <Select value={loginForm.role} onValueChange={(value) => setLoginForm({...loginForm, role: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                  <SelectItem value="cashier" className="text-white">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="login-email" className="text-white">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="login-password" className="text-white">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                  placeholder="••••••••"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Signing in...' : (
                <>
                  <LogInIcon className="w-4 h-4 mr-2" />
                  Sign In as {loginForm.role}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-slate-700 rounded-lg">
            <p className="text-sm text-gray-300 mb-2">Demo Credentials:</p>
            <p className="text-xs text-gray-400">Admin: admin@zone14.com / admin123</p>
            <p className="text-xs text-gray-400">Cashier: cashier@zone14.com / cashier123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
