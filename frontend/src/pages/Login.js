import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Sun, Moon, Loader2 } from 'lucide-react';
import axios from 'axios';

const UNIFY_LOGO = "https://customer-assets.emergentagent.com/job_campus-connect-464/artifacts/ghleffal_Screenshot_20260105-232031.Chrome.png";
const HERO_IMAGE = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigateByRole(user.role);
    }
  }, [user]);

  useEffect(() => {
    const seedDB = async () => {
      try {
        setSeeding(true);
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/seed`);
      } catch (error) {
        console.log('Database already seeded or seed failed');
      } finally {
        setSeeding(false);
      }
    };
    seedDB();
  }, []);

  const navigateByRole = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'mentor':
        navigate('/mentor-dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(email, password);
      toast.success(`Welcome back, ${userData.name}!`);
      navigateByRole(userData.role);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (type) => {
    const credentials = {
      admin: { email: 'admin@unify.com', password: 'Admin@123' },
      mentor: { email: 'ananya@unify.com', password: 'Mentor@123' },
      student: { email: 'koyena@unify.com', password: 'Student@123' },
    };
    setEmail(credentials[type].email);
    setPassword(credentials[type].password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary">
        <img
          src={HERO_IMAGE}
          alt="Campus"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/30" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <img src={UNIFY_LOGO} alt="UNIFY" className="w-20 h-20 rounded-2xl mb-6 object-cover" />
          <h1 className="text-4xl font-bold text-white font-['Outfit'] mb-4">
            Welcome to UNIFY
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Your Smart Campus Platform connecting students, mentors, and administration in one unified ecosystem.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 flex justify-between items-center">
          <div className="lg:hidden flex items-center gap-2">
            <img src={UNIFY_LOGO} alt="UNIFY" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-xl font-bold font-['Outfit']">UNIFY</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md glass-card">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold font-['Outfit']">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="login-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="login-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={loading || seeding}
                  data-testid="login-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : seeding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <p className="text-center text-sm text-muted-foreground mb-3">Quick Login</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('student')}
                    data-testid="quick-login-student"
                  >
                    Student
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('mentor')}
                    data-testid="quick-login-mentor"
                  >
                    Mentor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('admin')}
                    data-testid="quick-login-admin"
                  >
                    Admin
                  </Button>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
