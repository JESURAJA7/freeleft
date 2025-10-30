import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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
  { id: 'XbowSupport', label: 'Xbow Support', icon: LinkIcon, href: '/admin/xbow_support' },
  { id: 'withoutXbowSupport', label: 'Without Xbow Support', icon: LinkIcon, href: '/admin/without_xbow_support' },
  { id: 'loadApplications', label: 'Load Applications', icon: DocumentTextIcon, href: '/admin/load-applications' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile when resizing to desktop
      if (!mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, [isSidebarOpen]);

  // Close sidebar when clicking on menu item on mobile
  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Close sidebar when pressing escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  const handleLogout = () => {
    Cookies.remove('xbow_admin_token');
    Cookies.remove('xbow_admin_user');
    window.location.href = '/admin/login';
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const adminUser = Cookies.get('xbow_admin_user');
  const user = adminUser ? JSON.parse(adminUser) : null;

  const sidebarWidth = isSidebarCollapsed ? 'w-20' : 'w-64';
  const sidebarMobileClass = isSidebarOpen ? 'translate-x-0' : '-translate-x-full';

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : (isMobile ? -300 : 0),
          width: isMobile ? 256 : (isSidebarCollapsed ? 80 : 256)
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 lg:relative lg:z-auto lg:translate-x-0 ${
          isMobile ? `shadow-2xl ${sidebarMobileClass}` : sidebarWidth
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 bg-slate-800 shrink-0">
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed || isMobile ? (
                <motion.div
                  key="expanded-header"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-3"
                >
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Free Left Admin</span>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed-header"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center w-full"
                >
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Toggle Button - Hidden on mobile in sidebar */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* Close Button - Only on mobile */}
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-8 px-4 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed && !isMobile ? 'justify-center px-2' : 'space-x-3 px-4'
                    } py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {(!isSidebarCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-medium text-sm lg:text-base whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className={`p-4 border-t border-slate-700 shrink-0 ${
            isSidebarCollapsed && !isMobile ? 'px-2' : ''
          }`}>
            {(!isSidebarCollapsed || isMobile) ? (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">Administrator</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-300 hover:text-white hover:bg-slate-800 text-sm"
                  icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              // Collapsed user info
              <div className="flex flex-col items-center space-y-3">
                <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-slate-300" />
                </div>
                <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="w-full text-slate-300 hover:text-white hover:bg-slate-800"
                    icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />} children={undefined}                >
                  {/* Empty text for icon-only button */}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        !isMobile && !isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'
      }`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              {/* Toggle Button - Always visible in header */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isMobile ? (
                  <Bars3Icon className="h-6 w-6" />
                ) : isSidebarCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
              
              {/* Header Title - Hidden on mobile when sidebar icon is shown */}
              {!isMobile && (
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <ShieldCheckIcon className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-slate-900">XBOW Admin</h1>
                </div>
              )}
            </div>
            
            {/* Mobile Title - Centered on mobile */}
            {isMobile && (
              <h1 className="text-lg font-semibold text-slate-900 absolute left-1/2 transform -translate-x-1/2">
                XBOW Admin
              </h1>
            )}
            
            {/* User Avatar */}
            <div className="w-10 flex justify-end">
              <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-slate-600">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};