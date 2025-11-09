import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, BarChart3, Clock, LogOut, User, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Chat', href: '/', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Comparison', href: '/comparison', icon: Zap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'History', href: '/history', icon: Clock },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">TechStore AI</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Support Assistant</p>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 truncate">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/login" className="btn-primary w-full text-sm text-center block">
                Sign In
              </Link>
              <Link to="/register" className="btn-secondary w-full text-sm text-center block">
                Sign Up
              </Link>
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            <p>Multi-LLM RAG System</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
