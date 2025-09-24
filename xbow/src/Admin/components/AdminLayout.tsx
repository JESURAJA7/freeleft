import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  TruckIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  CogIcon,
  ChartBarIcon,
  LinkIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';
import Cookies from 'js-cookie';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, href: '/admin/dashboard' },
  { id: 'users', label: 'User Management', icon: UsersIcon, href: '/admin/users' },
  { id: 'vehicles', label: 'Vehicle Management', icon: TruckIcon, href: '/admin/vehicles' },
  { id: 'loads', label: 'Load Management', icon: DocumentTextIcon, href: '/admin/loads' },
  { id: 'matching', label: 'Load-Vehicle Matching', icon: LinkIcon, href: '/admin/matching' },
  { id: 'pods', label: 'POD Management', icon: DocumentTextIcon, href: '/admin/pods' },
  { id: 'commission', label: 'Commission', icon: CurrencyRupeeIcon, href: '/admin/commission' },
  { id: 'payments', label: 'Payments', icon: ChartBarIcon, href: '/admin/payments' },
  { id: 'settings', label: 'Settings', icon: CogIcon, href: '/admin/settings' }
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove('xbow_admin_token');
    Cookies.remove('xbow_admin_user');
    window.location.href = '/admin/login';
  };

  const adminUser = Cookies.get('xbow_admin_user');
  const user = adminUser ? JSON.parse(adminUser) : null;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 px-4 bg-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Free Left Admin</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full text-slate-300 hover:text-white hover:bg-slate-800"
            icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">XBOW Admin</h1>
            <div className="w-10"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};