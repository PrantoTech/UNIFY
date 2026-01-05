import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  Home, MessageSquare, Users, Calendar, Bell, Settings, LogOut,
  Menu, Sun, Moon, BookOpen, Bus, UtensilsCrossed, Search,
  FileText, AlertCircle, MessageCircle, BarChart3, Shield, X
} from 'lucide-react';

const UNIFY_LOGO = "https://customer-assets.emergentagent.com/job_campus-connect-464/artifacts/ghleffal_Screenshot_20260105-232031.Chrome.png";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const studentMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquare, label: 'Campus Connect', path: '/campus-connect' },
    { icon: Users, label: 'Clubs', path: '/clubs' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: BookOpen, label: 'Mentoring', path: '/mentoring' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: FileText, label: 'Notice Board', path: '/notices' },
    { icon: BookOpen, label: 'Library', path: '/library' },
    { icon: Bus, label: 'Transport', path: '/transport' },
    { icon: UtensilsCrossed, label: 'Canteen', path: '/canteen' },
    { icon: Search, label: 'Lost & Found', path: '/lost-found' },
    { icon: AlertCircle, label: 'Complaints', path: '/complaints' },
    { icon: MessageSquare, label: 'Feedback', path: '/feedback' },
  ];

  const mentorMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/mentor-dashboard' },
    { icon: Users, label: 'My Mentees', path: '/mentees' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: FileText, label: 'Notes', path: '/mentor-notes' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: MessageSquare, label: 'Campus Connect', path: '/campus-connect' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: FileText, label: 'Notices', path: '/notices' },
  ];

  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin-dashboard' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Users, label: 'Manage Users', path: '/manage-users' },
    { icon: FileText, label: 'Notices', path: '/manage-notices' },
    { icon: Calendar, label: 'Events', path: '/manage-events' },
    { icon: AlertCircle, label: 'Complaints', path: '/manage-complaints' },
    { icon: MessageSquare, label: 'Feedback', path: '/view-feedback' },
    { icon: UtensilsCrossed, label: 'Canteen Orders', path: '/canteen-orders' },
    { icon: Bus, label: 'Bookings', path: '/transport-bookings' },
  ];

  const getMenuItems = () => {
    if (user?.role === 'admin') return adminMenuItems;
    if (user?.role === 'mentor') return mentorMenuItems;
    return studentMenuItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={onItemClick}>
          <img src={UNIFY_LOGO} alt="UNIFY" className="h-10 w-10 rounded-xl object-cover" />
          <span className="text-xl font-bold tracking-tight font-['Outfit']">UNIFY</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          data-testid="sidebar-logout-btn"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent onItemClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={UNIFY_LOGO} alt="UNIFY" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-lg font-bold font-['Outfit']">UNIFY</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-mobile">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="user-menu-mobile">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <SidebarContent />
      </aside>

      {/* Desktop Header */}
      <header className="hidden lg:flex lg:ml-72 fixed top-0 right-0 left-72 z-40 glass border-b border-border">
        <div className="flex items-center justify-between w-full px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold font-['Outfit']">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{user?.role} Dashboard</p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-desktop">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button variant="ghost" size="icon" data-testid="notifications-btn">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3" data-testid="user-menu-desktop">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-72 pt-20 lg:pt-24 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
