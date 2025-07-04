import React, { useState } from 'react';
import { Users, UserCheck, UserX, TrendingUp, Filter } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import ActiveCustomersChart from './components/dashboard/ActiveCustomersChart';
import PaidCustomersChart from './components/dashboard/PaidCustomersChart';
import ChurnChart from './components/dashboard/ChurnChart';
import FunnelDashboard from './components/dashboard/FunnelDashboard';
import FilterControls from './components/dashboard/FilterControls';
import './App.css';

type DashboardView = 'active-customers' | 'paid-customers' | 'churned-customers' | 'funnel';

interface StaffFilter {
  operator: 'between' | 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value1: number;
  value2?: number;
}

interface Filters {
  startDate: string;
  endDate: string;
  professions: string[];
  countries: string[];
  memberships: string[];
  staffFilter: StaffFilter;
}

const navItems = [
  {
    id: 'active-customers' as DashboardView,
    label: 'Total Active Customers',
    icon: Users,
    description: 'Customers who booked appointments'
  },
  {
    id: 'paid-customers' as DashboardView,
    label: 'Total Paid Customers',
    icon: UserCheck,
    description: 'Customers with valid subscriptions'
  },
  {
    id: 'churned-customers' as DashboardView,
    label: 'Active Customer Churn',
    icon: UserX,
    description: 'Customers who have churned'
  },
  {
    id: 'funnel' as DashboardView,
    label: 'Funnel View',
    icon: TrendingUp,
    description: 'North Star → Inputs → Opportunities → Interventions'
  }
];

function App() {
  const [currentView, setCurrentView] = useState<DashboardView>('active-customers');
  const [filters, setFilters] = useState<Filters>({
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    professions: [],
    countries: [],
    memberships: [],
    staffFilter: {
      operator: 'gte',
      value1: 0
    }
  });

  const renderDashboardContent = () => {
    switch (currentView) {
      case 'active-customers':
        return <ActiveCustomersChart filters={filters} />;
      case 'paid-customers':
        return <PaidCustomersChart filters={filters} />;
      case 'churned-customers':
        return <ChurnChart filters={filters} />;
      case 'funnel':
        return <FunnelDashboard filters={filters} />;
      default:
        return <ActiveCustomersChart filters={filters} />;
    }
  };

  const currentNavItem = navItems.find(item => item.id === currentView);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-card border-r border-border p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <img src="/logo.png" alt="Raido" className="h-8 w-8" />
            Raido
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analytics Intelligence Platform
          </p>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-auto p-3 ${
                  isActive ? 'bg-primary text-primary-foreground' : ''
                }`}
                onClick={() => setCurrentView(item.id)}
              >
                <Icon className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-80">{item.description}</div>
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{currentNavItem?.label}</h2>
              <p className="text-muted-foreground">{currentNavItem?.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters & Controls</CardTitle>
                <CardDescription>
                  Adjust date range and other filters to refine your view
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FilterControls filters={filters} onFiltersChange={setFilters} />
              </CardContent>
            </Card>

            {/* Dashboard Content */}
            {renderDashboardContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
