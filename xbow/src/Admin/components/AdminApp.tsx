import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { UserManagement } from './UserManagement';
import { VehicleManagement } from './VehicleManagement';
import { LoadVehicleMatching } from './LoadVehicleMatching';
import { CommissionManagement } from './CommissionManagement';
import { PODManagementPage } from './PODManagementPage';
import { AdminApplicationsPage } from './AdminApplicationsPage';
import { XBOWSupportPage } from './XBOWSupportPage';
import { WithoutXBOWSupport } from './WithoutXBOWSupport';

export const AdminApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // 🚀 Force authentication true (skip login/register)
  const isAuthenticated = true;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'vehicles':
        return <VehicleManagement />;
      case 'XbowSupport':
        return <XBOWSupportPage />;
      case 'commission':
        return <CommissionManagement />;
      case 'loadApplications':
        return <AdminApplicationsPage/>;
        case 'withoutXbowSupport':
        return <WithoutXBOWSupport />;
      default:
        return <AdminDashboard />;
    }
  };

  if (!isAuthenticated) {
    // You can comment this part out if not needed at all
    return <div>Please login</div>;
  }

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};
