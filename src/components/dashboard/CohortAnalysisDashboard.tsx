import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Users, 
  X, 
  Calendar, 
  MapPin, 
  Badge, 
  Settings,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  CheckCircle
} from 'lucide-react';

interface CohortAnalysisFilters {
  cohortPeriod: 'weekly' | 'monthly';
  cohortRange: '3months' | '6months' | '12months';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  professions: string[];
  memberships: string[];
  countries: string[];
  staffCount: {
    min: number;
    max: number;
  };
}

interface CohortData {
  cohortName: string;
  cohortDate: string;
  totalUsers: number;
  completedOnboarding: number;
  completionRate: number;
  retentionByWeek: number[];
}

interface CohortAnalysisDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CohortAnalysisFilters;
  onFiltersChange: (filters: CohortAnalysisFilters) => void;
}

const generateMockCohortData = (filters: CohortAnalysisFilters): CohortData[] => {
  const cohorts = [];
  const today = new Date();
  const isWeekly = filters.cohortPeriod === 'weekly';
  
  // Calculate periods based on cohortRange
  const rangeToMonths = {
    '3months': 3,
    '6months': 6,
    '12months': 12
  };
  
  const monthsCount = rangeToMonths[filters.cohortRange];
  const periodsCount = isWeekly ? Math.floor(monthsCount * 4.33) : monthsCount; // ~4.33 weeks per month
  
  for (let i = periodsCount - 1; i >= 0; i--) {
    const cohortDate = new Date(today);
    if (isWeekly) {
      cohortDate.setDate(today.getDate() - (i * 7));
    } else {
      cohortDate.setMonth(today.getMonth() - i);
    }
    
    const cohortName = isWeekly 
      ? `Week ${cohortDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : cohortDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const totalUsers = Math.floor(Math.random() * 150) + 50; // 50-200 users
    const completedOnboarding = Math.floor(totalUsers * (0.65 + Math.random() * 0.25)); // 65-90% completion
    const completionRate = (completedOnboarding / totalUsers) * 100;
    
    // Generate retention by week (how many users are still active after N weeks)
    const retentionByWeek = [];
    let retentionRate = 1;
    for (let week = 0; week < 8; week++) {
      retentionRate *= (0.85 + Math.random() * 0.1); // 85-95% retention each week
      retentionByWeek.push(retentionRate * 100);
    }
    
    cohorts.push({
      cohortName,
      cohortDate: cohortDate.toISOString().split('T')[0],
      totalUsers,
      completedOnboarding,
      completionRate,
      retentionByWeek
    });
  }
  
  return cohorts;
};

const CohortAnalysisDashboard: React.FC<CohortAnalysisDashboardProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockData = generateMockCohortData(filters);
        setCohortData(mockData);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, filters]);



  const updateFilters = (updates: Partial<CohortAnalysisFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const getTotalStats = () => {
    const totalUsers = cohortData.reduce((sum, d) => sum + d.totalUsers, 0);
    const totalCompleted = cohortData.reduce((sum, d) => sum + d.completedOnboarding, 0);
    const avgCompletionRate = cohortData.reduce((sum, d) => sum + d.completionRate, 0) / cohortData.length;
    const avgRetentionWeek1 = cohortData.reduce((sum, d) => sum + (d.retentionByWeek[0] || 0), 0) / cohortData.length;

    return { totalUsers, totalCompleted, avgCompletionRate, avgRetentionWeek1 };
  };

  const getHeatmapColor = (rate: number): string => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    if (rate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!isOpen) return null;

  const stats = getTotalStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Cohort Analysis - Onboarding Completion
              </CardTitle>
              <CardDescription>
                Analyze user retention and onboarding completion across cohorts
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Total Users</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Completed Onboarding</p>
                      <p className="text-2xl font-bold text-green-700">{stats.totalCompleted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600">Avg Completion Rate</p>
                      <p className="text-2xl font-bold text-purple-700">{stats.avgCompletionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600">Week 1 Retention</p>
                      <p className="text-2xl font-bold text-orange-700">{stats.avgRetentionWeek1.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4 text-gray-800">Filters</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.dateRange.startDate}
                      onChange={(e) => updateFilters({
                        dateRange: { ...filters.dateRange, startDate: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.endDate}
                      onChange={(e) => updateFilters({
                        dateRange: { ...filters.dateRange, endDate: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Staff Count Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Settings className="h-4 w-4 inline mr-1" />
                    Staff Count Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.staffCount.min}
                      onChange={(e) => updateFilters({
                        staffCount: { ...filters.staffCount, min: parseInt(e.target.value) || 0 }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.staffCount.max}
                      onChange={(e) => updateFilters({
                        staffCount: { ...filters.staffCount, max: parseInt(e.target.value) || 100 }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Professions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Professions
                  </label>
                  <select
                    multiple
                    value={filters.professions}
                    onChange={(e) => updateFilters({
                      professions: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    size={3}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="therapist">Therapist</option>
                    <option value="administrator">Administrator</option>
                    <option value="specialist">Specialist</option>
                  </select>
                </div>

                {/* Countries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Countries
                  </label>
                  <select
                    multiple
                    value={filters.countries}
                    onChange={(e) => updateFilters({
                      countries: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    size={3}
                  >
                    <option value="usa">USA</option>
                    <option value="canada">Canada</option>
                    <option value="uk">UK</option>
                    <option value="australia">Australia</option>
                    <option value="germany">Germany</option>
                  </select>
                </div>

                {/* Memberships */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Badge className="h-4 w-4 inline mr-1" />
                    Memberships
                  </label>
                  <select
                    multiple
                    value={filters.memberships}
                    onChange={(e) => updateFilters({
                      memberships: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    size={3}
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="pro">Pro</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>
              </div>
            </div>



            {/* Cohort Controls */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-6 items-center">
                {/* Cohort Period Selection */}
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Cohort Period</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.cohortPeriod === 'weekly' ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ cohortPeriod: 'weekly' })}
                    >
                      Weekly
                    </Button>
                    <Button
                      variant={filters.cohortPeriod === 'monthly' ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ cohortPeriod: 'monthly' })}
                    >
                      Monthly
                    </Button>
                  </div>
                </div>

                {/* Cohort Range Selection */}
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Cohort Range</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.cohortRange === '3months' ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ cohortRange: '3months' })}
                    >
                      3 Months
                    </Button>
                    <Button
                      variant={filters.cohortRange === '6months' ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ cohortRange: '6months' })}
                    >
                      6 Months
                    </Button>
                    <Button
                      variant={filters.cohortRange === '12months' ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ cohortRange: '12months' })}
                    >
                      12 Months
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cohort Analysis Table */}
            <div className="bg-white rounded-lg border p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold mb-4 text-gray-800">
                    Cohort Analysis Table - {filters.cohortPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Cohorts
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Cohort</th>
                          <th className="text-left p-2">Users</th>
                          <th className="text-left p-2">Completed</th>
                          <th className="text-left p-2">Week 1</th>
                          <th className="text-left p-2">Week 2</th>
                          <th className="text-left p-2">Week 3</th>
                          <th className="text-left p-2">Week 4</th>
                          <th className="text-left p-2">Week 5</th>
                          <th className="text-left p-2">Week 6</th>
                          <th className="text-left p-2">Week 7</th>
                          <th className="text-left p-2">Week 8</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohortData.map((cohort, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{cohort.cohortName}</td>
                            <td className="p-2">{cohort.totalUsers}</td>
                            <td className="p-2">{cohort.completionRate.toFixed(1)}%</td>
                            {cohort.retentionByWeek.map((retention, weekIndex) => (
                              <td key={weekIndex} className="p-2">
                                <span 
                                  className={`px-2 py-1 rounded text-white text-xs ${getHeatmapColor(retention)}`}
                                >
                                  {retention.toFixed(0)}%
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CohortAnalysisDashboard; 