import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './common/CustomButton';
import { Clock, Truck, FileText, LogOut, LogIn } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">LoadBid</span>
            </div>
            <Link to="/login">
              <Button icon={<LogIn className="h-4 w-4" />}>
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">LoadBid</span>
            </div>
            
            <div className="flex space-x-4">
              <Link
                to="/live-bidding"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/live-bidding')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Live Bidding
              </Link>
              
              <Link
                to="/loads"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/loads')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                {user.role === 'load_provider' ? 'My Loads' : 'Available Loads'}
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user.name || 'User'} ({user.role === 'load_provider' ? 'Load Provider' : 'Vehicle Owner'})
            </span>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              icon={<LogOut className="h-4 w-4" />}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};