import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, Users, Target, Zap, ArrowRight, BarChart3, PieChart, LineChart, ChevronDown, ChevronUp, AlertTriangle, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import ActiveAccountsDetailDashboard from './ActiveAccountsDetailDashboard';
import StaffCountDetailDashboard from './StaffCountDetailDashboard';
import ChurnDetailDashboard from './ChurnDetailDashboard';
import UpsellDetailDashboard from './UpsellDetailDashboard';
import DowngradeDetailDashboard from './DowngradeDetailDashboard';
import NegativeChurnDetailDashboard from './NegativeChurnDetailDashboard';
import TimeToValueDetailDashboard from './TimeToValueDetailDashboard';
import CohortAnalysisDashboard from './CohortAnalysisDashboard';
import RetentionDetailDashboard from './RetentionDetailDashboard';

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

interface OpportunityData {
  id: string;
  name: string;
  inputType: 'activeAccounts' | 'staffCount' | 'both';
  metric: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  associatedInterventions: string[];
  cohortData: any[];
}

interface InterventionFactor {
  metric: string;
  value: string;
  trend: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  source: string;
}

interface InterventionData {
  id: string;
  name: string;
  type: string;
  relevanceScore: number;
  projectCount: number;
  roiEffort: number;
  totalScore: number;
  linkedOpportunities: string[];
  description: string;
  suggestingFactors: InterventionFactor[];
}

interface FunnelData {
  northStarMetric: string;
  inputs: {
    activeAccounts: number;
    staffCount: number;
  };
  opportunities: OpportunityData[];
  interventions: InterventionData[];
}

interface StaffBucket {
  id: string;
  name: string;
  min: number;
  max: number;
}

interface DetailFilters {
  signupDateRange: {
    start: string;
    end: string;
  };
  professions: string[];
  memberships: string[];
  countries: string[];
  staffCount: {
    min: number;
    max: number;
  };
  xAxis: 'profession' | 'country' | 'membership' | 'staffBuckets';
  staffBuckets: StaffBucket[];
}

interface ChurnFilters {
  timeRange: {
    period: '1month' | '3months' | '6months' | '1year';
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

interface UpsellFilters {
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
  xAxis: 'profession' | 'country' | 'membership';
}

interface DowngradeFilters {
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
  xAxis: 'profession' | 'country' | 'membership';
}

interface NegativeChurnFilters {
  timePeriod: '1month' | '3months' | '6months' | '1year';
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

interface TimeToValueFilters {
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

interface RetentionFilters {
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

interface FunnelDashboardProps {
  filters: Filters;
}

const generateMockFunnelData = (filters: Filters): FunnelData => {
  const baseActiveAccounts = 2034;
  const baseStaffCount = 5190;
  
  const activeAccounts = Math.floor(baseActiveAccounts * (filters.staffFilter.value1 > 10 ? 0.8 : 1));
  const staffCount = Math.floor(baseStaffCount * (filters.professions.length > 0 ? 0.6 : 1));

  const opportunities: OpportunityData[] = [
    {
      id: 'churn',
      name: 'Customer Churn',
      inputType: 'activeAccounts',
      metric: 'churnRate',
      value: Math.floor(activeAccounts * 0.15),
      percentage: 15,
      trend: 'down',
      associatedInterventions: ['customerSupport', 'onboarding', 'engagement'],
      cohortData: []
    },
    {
      id: 'retention',
      name: 'Customer Retention',
      inputType: 'activeAccounts',
      metric: 'retentionRate',
      value: Math.floor(activeAccounts * 0.85),
      percentage: 85,
      trend: 'up',
      associatedInterventions: ['customerSupport', 'caseStudies', 'engagement'],
      cohortData: []
    },
    {
      id: 'onboardingCompletion',
      name: 'Onboarding Completion',
      inputType: 'activeAccounts',
      metric: 'completionRate',
      value: Math.floor(activeAccounts * 0.72),
      percentage: 72,
      trend: 'stable',
      associatedInterventions: ['onboarding', 'customerSupport', 'documentation'],
      cohortData: []
    },
    {
      id: 'timeToValue',
      name: 'Time to Value',
      inputType: 'activeAccounts',
      metric: 'avgDaysToValue',
      value: 12,
      percentage: 0,
      trend: 'down',
      associatedInterventions: ['onboarding', 'quickStart', 'customerSupport'],
      cohortData: []
    },
    {
      id: 'conversionRate',
      name: 'Conversion Rate',
      inputType: 'activeAccounts',
      metric: 'conversionRate',
      value: Math.floor(activeAccounts * 0.12),
      percentage: 12,
      trend: 'up',
      associatedInterventions: ['landingPages', 'seo', 'contentMarketing'],
      cohortData: []
    },

    {
      id: 'upselling',
      name: 'Upselling',
      inputType: 'staffCount',
      metric: 'upsellRate',
      value: Math.floor(staffCount * 0.08),
      percentage: 8,
      trend: 'up',
      associatedInterventions: ['salesTraining', 'battleCards', 'caseStudies'],
      cohortData: []
    },
    {
      id: 'downgrading',
      name: 'Plan Downgrading',
      inputType: 'staffCount',
      metric: 'downgradeRate',
      value: Math.floor(staffCount * 0.03),
      percentage: 3,
      trend: 'down',
      associatedInterventions: ['customerSupport', 'valueRealization', 'engagement'],
      cohortData: []
    },
    {
      id: 'negativeChurn',
      name: 'Negative Churn',
      inputType: 'both',
      metric: 'negativeChurnRate',
      value: Math.floor((activeAccounts + staffCount) * 0.05),
      percentage: 5,
      trend: 'up',
      associatedInterventions: ['upselling', 'expansion', 'accountManagement'],
      cohortData: []
    }
  ];

  const interventions: InterventionData[] = [
    {
      id: 'customerSupport',
      name: 'Customer Support Enhancement',
      type: 'support',
      relevanceScore: 85,
      projectCount: 3,
      roiEffort: 75,
      totalScore: 83,
      linkedOpportunities: ['churn', 'retention', 'onboardingCompletion', 'downgrading'],
      description: 'Improve response times and quality of customer support',
      suggestingFactors: [
        {
          metric: 'Support Ticket Volume',
          value: '+23% last quarter',
          trend: 'negative',
          impact: 'high',
          source: 'Customer Support Analytics'
        },
        {
          metric: 'Avg Response Time',
          value: '4.2 hours',
          trend: 'negative',
          impact: 'high',
          source: 'Support Queue Metrics'
        },
        {
          metric: 'Customer Satisfaction Score',
          value: '3.2/5 (down from 3.8)',
          trend: 'negative',
          impact: 'medium',
          source: 'Post-Support Surveys'
        },
        {
          metric: 'Churn Rate Correlation',
          value: '68% of churned users had unresolved tickets',
          trend: 'negative',
          impact: 'high',
          source: 'Churn Analysis Dashboard'
        }
      ]
    },
    {
      id: 'onboarding',
      name: 'Onboarding Optimization',
      type: 'product',
      relevanceScore: 90,
      projectCount: 2,
      roiEffort: 80,
      totalScore: 87,
      linkedOpportunities: ['onboardingCompletion', 'timeToValue', 'retention'],
      description: 'Streamline user onboarding process',
      suggestingFactors: [
        {
          metric: 'Onboarding Completion Rate',
          value: '72% (target: 85%)',
          trend: 'negative',
          impact: 'high',
          source: 'User Analytics'
        },
        {
          metric: 'Drop-off Point Analysis',
          value: '38% abandon at step 3',
          trend: 'negative',
          impact: 'high',
          source: 'Funnel Analytics'
        },
        {
          metric: 'Time to First Value',
          value: '12 days (industry avg: 7 days)',
          trend: 'negative',
          impact: 'medium',
          source: 'Cohort Analysis'
        },
        {
          metric: 'User Feedback Score',
          value: '"Confusing setup process" (47% feedback)',
          trend: 'negative',
          impact: 'medium',
          source: 'User Interview Analysis'
        }
      ]
    },
    {
      id: 'salesTraining',
      name: 'Sales Team Training',
      type: 'sales',
      relevanceScore: 70,
      projectCount: 1,
      roiEffort: 60,
      totalScore: 67,
      linkedOpportunities: ['upselling'],
      description: 'Enhanced sales training and methodologies',
      suggestingFactors: [
        {
          metric: 'Upsell Success Rate',
          value: '8% (industry avg: 15%)',
          trend: 'negative',
          impact: 'high',
          source: 'Sales Performance Dashboard'
        },
        {
          metric: 'Deal Close Rate',
          value: '22% (down 8% YoY)',
          trend: 'negative',
          impact: 'medium',
          source: 'CRM Analytics'
        },
        {
          metric: 'Sales Cycle Length',
          value: '45 days (up from 32 days)',
          trend: 'negative',
          impact: 'medium',
          source: 'Pipeline Analysis'
        },
        {
          metric: 'Team Performance Variance',
          value: 'Top 20% vs Bottom 20%: 3.2x difference',
          trend: 'neutral',
          impact: 'high',
          source: 'Sales Team Analytics'
        }
      ]
    },
    {
      id: 'landingPages',
      name: 'Landing Page Optimization',
      type: 'marketing',
      relevanceScore: 75,
      projectCount: 4,
      roiEffort: 85,
      totalScore: 78,
      linkedOpportunities: ['conversionRate', 'signupRate'],
      description: 'A/B test and optimize landing pages',
      suggestingFactors: [
        {
          metric: 'Conversion Rate',
          value: '2.1% (industry avg: 3.5%)',
          trend: 'negative',
          impact: 'high',
          source: 'Google Analytics'
        },
        {
          metric: 'Bounce Rate',
          value: '68% (up 12% this quarter)',
          trend: 'negative',
          impact: 'medium',
          source: 'Web Analytics'
        },
        {
          metric: 'Page Load Speed',
          value: '4.2s (target: <3s)',
          trend: 'negative',
          impact: 'medium',
          source: 'Core Web Vitals'
        },
        {
          metric: 'Mobile Conversion Gap',
          value: '45% lower than desktop',
          trend: 'negative',
          impact: 'high',
          source: 'Device Analytics'
        }
      ]
    },
    {
      id: 'engagement',
      name: 'User Engagement Programs',
      type: 'product',
      relevanceScore: 80,
      projectCount: 2,
      roiEffort: 70,
      totalScore: 77,
      linkedOpportunities: ['churn', 'retention', 'downgrading'],
      description: 'Implement engagement tracking and improvement programs',
      suggestingFactors: [
        {
          metric: 'Daily Active Users',
          value: '52% (down from 61%)',
          trend: 'negative',
          impact: 'high',
          source: 'Product Analytics'
        },
        {
          metric: 'Feature Adoption Rate',
          value: '34% for core features',
          trend: 'negative',
          impact: 'medium',
          source: 'Feature Usage Analytics'
        },
        {
          metric: 'Session Duration',
          value: '8.2 min (down 22%)',
          trend: 'negative',
          impact: 'medium',
          source: 'User Behavior Analytics'
        },
        {
          metric: 'Inactive User Recovery',
          value: 'Only 12% return after 7-day absence',
          trend: 'negative',
          impact: 'high',
          source: 'Cohort Analysis'
        }
      ]
    },
    {
      id: 'accountManagement',
      name: 'Account Management',
      type: 'sales',
      relevanceScore: 85,
      projectCount: 1,
      roiEffort: 65,
      totalScore: 79,
      linkedOpportunities: ['negativeChurn', 'upselling'],
      description: 'Dedicated account management for key customers',
      suggestingFactors: [
        {
          metric: 'Enterprise Account Growth',
          value: '+2.3% (target: +8%)',
          trend: 'negative',
          impact: 'high',
          source: 'Revenue Analytics'
        },
        {
          metric: 'Account Manager Ratio',
          value: '1:47 (industry best: 1:25)',
          trend: 'negative',
          impact: 'high',
          source: 'Resource Planning'
        },
        {
          metric: 'Customer Health Score',
          value: '23% of enterprise accounts "at risk"',
          trend: 'negative',
          impact: 'high',
          source: 'Customer Success Platform'
        },
        {
          metric: 'Expansion Revenue',
          value: '18% of total revenue (target: 30%)',
          trend: 'negative',
          impact: 'medium',
          source: 'Revenue Tracking'
        }
      ]
    }
  ];

  return {
    northStarMetric: `${(activeAccounts + staffCount * 0.8).toLocaleString()} Total Appointments`,
    inputs: {
      activeAccounts,
      staffCount
    },
    opportunities,
    interventions: interventions.sort((a, b) => b.totalScore - a.totalScore)
  };
};

const FunnelDashboard: React.FC<FunnelDashboardProps> = ({ filters }) => {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [showDetailDashboard, setShowDetailDashboard] = useState(false);
  const [showStaffDetailDashboard, setShowStaffDetailDashboard] = useState(false);
  const [showChurnDetailDashboard, setShowChurnDetailDashboard] = useState(false);
  const [showUpsellDetailDashboard, setShowUpsellDetailDashboard] = useState(false);
  const [showDowngradeDetailDashboard, setShowDowngradeDetailDashboard] = useState(false);
  const [showNegativeChurnDetailDashboard, setShowNegativeChurnDetailDashboard] = useState(false);
  const [showTimeToValueDetailDashboard, setShowTimeToValueDetailDashboard] = useState(false);
  const [showCohortAnalysisDashboard, setShowCohortAnalysisDashboard] = useState(false);
  const [showConversionCohortDashboard, setShowConversionCohortDashboard] = useState(false);
  const [expandedInterventions, setExpandedInterventions] = useState<Set<string>>(new Set());
  const [detailFilters, setDetailFilters] = useState<DetailFilters>({
    signupDateRange: {
      start: '2023-01-01',
      end: '2024-12-31'
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    },
    xAxis: 'profession',
    staffBuckets: [
      { id: '1', name: 'Small (1-10)', min: 1, max: 10 },
      { id: '2', name: 'Medium (11-50)', min: 11, max: 50 },
      { id: '3', name: 'Large (51+)', min: 51, max: 999 }
    ]
  });

  const [churnFilters, setChurnFilters] = useState<ChurnFilters>({
    timeRange: {
      period: '3months',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    }
  });

  const [upsellFilters, setUpsellFilters] = useState<UpsellFilters>({
    dateRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    },
    xAxis: 'profession'
  });

  const [downgradeFilters, setDowngradeFilters] = useState<DowngradeFilters>({
    dateRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    },
    xAxis: 'profession'
  });

  const [negativeChurnFilters, setNegativeChurnFilters] = useState<NegativeChurnFilters>({
    timePeriod: '3months',
    dateRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    }
  });

  const [timeToValueFilters, setTimeToValueFilters] = useState<TimeToValueFilters>({
    dateRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    }
  });

  const [cohortAnalysisFilters, setCohortAnalysisFilters] = useState<CohortAnalysisFilters>({
    cohortPeriod: 'weekly',
    cohortRange: '6months',
    dateRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    }
  });

  const [conversionCohortFilters, setConversionCohortFilters] = useState<CohortAnalysisFilters>({
    cohortPeriod: 'monthly',
    cohortRange: '6months',
    dateRange: {
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    }
  });

  const [showRetentionDetailDashboard, setShowRetentionDetailDashboard] = useState(false);
  const [retentionFilters, setRetentionFilters] = useState<RetentionFilters>({
    cohortPeriod: 'weekly',
    cohortRange: '6months',
    dateRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    professions: [],
    memberships: [],
    countries: [],
    staffCount: {
      min: 0,
      max: 100
    }
  });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockData = generateMockFunnelData(filters);
      setFunnelData(mockData);
      setLoading(false);
    }, 500);
  }, [filters]);



  const handleComponentClick = (type: 'input' | 'opportunity', id: string) => {
    if (type === 'input' && id === 'activeAccounts') {
      setShowDetailDashboard(true);
    } else if (type === 'input' && id === 'staffCount') {
      setShowStaffDetailDashboard(true);
    } else if (type === 'opportunity' && id === 'churn') {
      setShowChurnDetailDashboard(true);
    } else if (type === 'opportunity' && id === 'upselling') {
      setShowUpsellDetailDashboard(true);
    } else if (type === 'opportunity' && id === 'downgrading') {
      setShowDowngradeDetailDashboard(true);
    } else if (type === 'opportunity' && id === 'negativeChurn') {
      setShowNegativeChurnDetailDashboard(true);
    } else if (type === 'opportunity' && id === 'timeToValue') {
      setShowTimeToValueDetailDashboard(true);
    } else if (type === 'opportunity' && id === 'onboardingCompletion') {
      setShowCohortAnalysisDashboard(true);
    } else if (type === 'opportunity' && id === 'conversionRate') {
      setShowConversionCohortDashboard(true);
    } else if (type === 'opportunity' && id === 'retention') {
      setShowRetentionDetailDashboard(true);
    } else {
      setSelectedComponent(`${type}-${id}`);
      console.log(`Opening detailed view for ${type}: ${id}`);
    }
  };

  const getOpportunitiesByInput = (inputType: 'activeAccounts' | 'staffCount' | 'both') => {
    return funnelData?.opportunities.filter(opp => 
      opp.inputType === inputType || opp.inputType === 'both'
    ) || [];
  };

  const applyStaffFilter = (staffCount: number, filter: StaffFilter): boolean => {
    switch (filter.operator) {
      case 'between':
        return staffCount >= filter.value1 && staffCount <= (filter.value2 || filter.value1);
      case 'gt':
        return staffCount > filter.value1;
      case 'gte':
        return staffCount >= filter.value1;
      case 'lt':
        return staffCount < filter.value1;
      case 'lte':
        return staffCount <= filter.value1;
      case 'eq':
        return staffCount === filter.value1;
      default:
        return true;
    }
  };

  const toggleInterventionExpansion = (interventionId: string) => {
    setExpandedInterventions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interventionId)) {
        newSet.delete(interventionId);
      } else {
        newSet.add(interventionId);
      }
      return newSet;
    });
  };

  const getTrendIcon = (trend: 'positive' | 'negative' | 'neutral') => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Analysis</CardTitle>
          <CardDescription>Loading funnel data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!funnelData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            North Star Funnel Analysis
          </CardTitle>
          <CardDescription>
            Interactive funnel showing the path from inputs through opportunities to interventions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 md:p-8">
            
            {/* North Star Metric */}
            <div className="flex justify-center mb-8" id="north-star">
              <div className="neomorphic-card bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h3 className="text-xl font-bold text-yellow-500 drop-shadow-lg">{funnelData.northStarMetric}</h3>
                    <p className="text-black">North Star Metric</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 md:gap-12 mb-12" id="inputs-section">
              
              {/* Active Accounts Input */}
              <div
                id="active-accounts-input"
                className={`neomorphic-input cursor-pointer transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl w-full sm:w-auto ${
                  hoveredComponent === 'activeAccounts' ? 'ring-4 ring-blue-300' : ''
                }`}
                onMouseEnter={() => setHoveredComponent('activeAccounts')}
                onMouseLeave={() => setHoveredComponent(null)}
                onClick={() => handleComponentClick('input', 'activeAccounts')}
              >
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="font-bold text-gray-800">Active Accounts</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{funnelData.inputs.activeAccounts.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Customer Base</p>
                  <div className="flex items-center gap-1 mt-2">
                    <BarChart3 className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Click for detailed analysis</span>
                  </div>
                </div>
              </div>

              {/* Staff Count Input */}
              <div
                id="staff-count-input"
                className={`neomorphic-input cursor-pointer transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl w-full sm:w-auto ${
                  hoveredComponent === 'staffCount' ? 'ring-4 ring-green-300' : ''
                }`}
                onMouseEnter={() => setHoveredComponent('staffCount')}
                onMouseLeave={() => setHoveredComponent(null)}
                onClick={() => handleComponentClick('input', 'staffCount')}
              >
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-gray-800">Staff Count</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{funnelData.inputs.staffCount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Team Size</p>
                  <div className="flex items-center gap-1 mt-2">
                    <BarChart3 className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Click for detailed analysis</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunities Grid */}
            <div className="mb-12" id="opportunities-section">
              <h3 className="text-xl font-bold text-center mb-8 text-gray-800">Opportunities</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* Active Accounts Opportunities */}
                <div className="space-y-4">
                  <h4 className="text-center font-semibold text-blue-700 mb-4">From Active Accounts</h4>
                  {getOpportunitiesByInput('activeAccounts').map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className={`opportunity-card cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                        hoveredComponent === opportunity.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                      onMouseEnter={() => setHoveredComponent(opportunity.id)}
                      onMouseLeave={() => setHoveredComponent(null)}
                      onClick={() => handleComponentClick('opportunity', opportunity.id)}
                    >
                      <div className="bg-white rounded-lg p-4 shadow-md border border-blue-100 hover:border-blue-300">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-800 text-sm">{opportunity.name}</h5>
                          <div className={`w-2 h-2 rounded-full ${
                            opportunity.trend === 'up' ? 'bg-green-400' : 
                            opportunity.trend === 'down' ? 'bg-red-400' : 'bg-yellow-400'
                          }`} />
                        </div>
                        <p className="text-lg font-bold text-blue-600">{opportunity.value.toLocaleString()}</p>
                        {opportunity.percentage > 0 && (
                          <p className="text-xs text-gray-600">{opportunity.percentage}%</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <BarChart3 className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Click for details</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Staff Count Opportunities */}
                <div className="space-y-4">
                  <h4 className="text-center font-semibold text-green-700 mb-4">From Staff Count</h4>
                  {getOpportunitiesByInput('staffCount').map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className={`opportunity-card cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                        hoveredComponent === opportunity.id ? 'ring-2 ring-green-400' : ''
                      }`}
                      onMouseEnter={() => setHoveredComponent(opportunity.id)}
                      onMouseLeave={() => setHoveredComponent(null)}
                      onClick={() => handleComponentClick('opportunity', opportunity.id)}
                    >
                      <div className="bg-white rounded-lg p-4 shadow-md border border-green-100 hover:border-green-300">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-800 text-sm">{opportunity.name}</h5>
                          <div className={`w-2 h-2 rounded-full ${
                            opportunity.trend === 'up' ? 'bg-green-400' : 
                            opportunity.trend === 'down' ? 'bg-red-400' : 'bg-yellow-400'
                          }`} />
                        </div>
                        <p className="text-lg font-bold text-green-600">{opportunity.value.toLocaleString()}</p>
                        {opportunity.percentage > 0 && (
                          <p className="text-xs text-gray-600">{opportunity.percentage}%</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <PieChart className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Click for details</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Combined Opportunities */}
                <div className="space-y-4">
                  <h4 className="text-center font-semibold text-purple-700 mb-4">Combined Impact</h4>
                  {getOpportunitiesByInput('both').map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className={`opportunity-card cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                        hoveredComponent === opportunity.id ? 'ring-2 ring-purple-400' : ''
                      }`}
                      onMouseEnter={() => setHoveredComponent(opportunity.id)}
                      onMouseLeave={() => setHoveredComponent(null)}
                      onClick={() => handleComponentClick('opportunity', opportunity.id)}
                    >
                      <div className="bg-white rounded-lg p-4 shadow-md border border-purple-100 hover:border-purple-300">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-800 text-sm">{opportunity.name}</h5>
                          <div className={`w-2 h-2 rounded-full ${
                            opportunity.trend === 'up' ? 'bg-green-400' : 
                            opportunity.trend === 'down' ? 'bg-red-400' : 'bg-yellow-400'
                          }`} />
                        </div>
                        <p className="text-lg font-bold text-purple-600">{opportunity.value.toLocaleString()}</p>
                        {opportunity.percentage > 0 && (
                          <p className="text-xs text-gray-600">{opportunity.percentage}%</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <LineChart className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Click for details</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interventions Section */}
            <div id="interventions-section">
              <h3 className="text-xl font-bold text-center mb-8 text-gray-800">Recommended Interventions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {funnelData.interventions.slice(0, 6).map((intervention) => {
                  const isExpanded = expandedInterventions.has(intervention.id);
                  return (
                    <div
                      key={intervention.id}
                      className={`intervention-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        hoveredComponent === intervention.id ? 'ring-2 ring-purple-400' : ''
                      } ${isExpanded ? 'lg:col-span-2' : ''}`}
                      onMouseEnter={() => setHoveredComponent(intervention.id)}
                      onMouseLeave={() => setHoveredComponent(null)}
                    >
                      <div className="bg-gradient-to-br from-white to-purple-50 rounded-lg p-4 shadow-md border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-800 text-sm">{intervention.name}</h5>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-600" />
                            <button
                              onClick={() => toggleInterventionExpansion(intervention.id)}
                              className="p-1 rounded-full hover:bg-purple-100 transition-colors"
                              title={isExpanded ? 'Hide factors' : 'Show suggesting factors'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-purple-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-purple-600" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1">
                            <div className="text-xs text-gray-600">Total Score</div>
                            <div className="text-lg font-bold text-purple-600">{intervention.totalScore}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-600">Projects</div>
                            <div className="text-sm font-semibold text-gray-700">{intervention.projectCount}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                          <div className="text-center">
                            <div className="text-gray-500">Relevance</div>
                            <div className="font-semibold">{intervention.relevanceScore}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">ROI</div>
                            <div className="font-semibold">{intervention.roiEffort}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">Impact</div>
                            <div className="font-semibold">{Math.round(intervention.totalScore / 10)}</div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">{intervention.description}</p>
                        
                        {/* Collapsed state: Show factor count */}
                        {!isExpanded && (
                          <div className="flex items-center justify-between text-xs text-purple-600 bg-purple-50 rounded px-2 py-1">
                            <span>{intervention.suggestingFactors.length} suggesting factors</span>
                            <AlertTriangle className="h-3 w-3" />
                          </div>
                        )}
                        
                        {/* Expanded state: Show all factors */}
                        {isExpanded && (
                          <div className="mt-3 space-y-3">
                            <div className="border-t border-purple-200 pt-3">
                              <h6 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                                Suggesting Factors
                              </h6>
                              <div className="space-y-2">
                                {intervention.suggestingFactors.map((factor, index) => (
                                  <div key={index} className="bg-white rounded border border-gray-200 p-2">
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-1 mb-1">
                                          {getTrendIcon(factor.trend)}
                                          <span className="text-xs font-medium text-gray-800">{factor.metric}</span>
                                          <span className={`text-xs px-1 py-0.5 rounded border ${getImpactColor(factor.impact)}`}>
                                            {factor.impact}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-700 font-medium">{factor.value}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500 flex items-center gap-1">
                                        <ExternalLink className="h-3 w-3" />
                                        {factor.source}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>



          </div>
        </CardContent>
      </Card>

      {/* Selected Component Details Modal would go here */}
      {selectedComponent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detailed Analysis: {selectedComponent}</CardTitle>
            <CardDescription>
              Click outside or press ESC to close this detailed view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Detailed graph and cohort analysis for {selectedComponent}</p>
                <p className="text-sm text-gray-500 mt-2">This would show relevant metrics and cohort data</p>
                <button 
                  onClick={() => setSelectedComponent(null)}
                  className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Accounts Detail Dashboard */}
      <ActiveAccountsDetailDashboard
        isOpen={showDetailDashboard}
        onClose={() => setShowDetailDashboard(false)}
        filters={detailFilters}
        onFiltersChange={setDetailFilters}
      />

      {/* Staff Count Detail Dashboard */}
      <StaffCountDetailDashboard
        isOpen={showStaffDetailDashboard}
        onClose={() => setShowStaffDetailDashboard(false)}
        filters={detailFilters}
        onFiltersChange={setDetailFilters}
      />

      {/* Churn Detail Dashboard */}
      <ChurnDetailDashboard
        isOpen={showChurnDetailDashboard}
        onClose={() => setShowChurnDetailDashboard(false)}
        filters={churnFilters}
        onFiltersChange={setChurnFilters}
      />

      {/* Upsell Detail Dashboard */}
      <UpsellDetailDashboard
        isOpen={showUpsellDetailDashboard}
        onClose={() => setShowUpsellDetailDashboard(false)}
        filters={upsellFilters}
        onFiltersChange={setUpsellFilters}
      />

      {/* Downgrade Detail Dashboard */}
      <DowngradeDetailDashboard
        isOpen={showDowngradeDetailDashboard}
        onClose={() => setShowDowngradeDetailDashboard(false)}
        filters={downgradeFilters}
        onFiltersChange={setDowngradeFilters}
      />

      {/* Negative Churn Detail Dashboard */}
      <NegativeChurnDetailDashboard
        isOpen={showNegativeChurnDetailDashboard}
        onClose={() => setShowNegativeChurnDetailDashboard(false)}
        filters={negativeChurnFilters}
        onFiltersChange={setNegativeChurnFilters}
      />

      {/* Time to Value Detail Dashboard */}
      <TimeToValueDetailDashboard
        isOpen={showTimeToValueDetailDashboard}
        onClose={() => setShowTimeToValueDetailDashboard(false)}
        filters={timeToValueFilters}
        onFiltersChange={setTimeToValueFilters}
      />

      {/* Cohort Analysis Dashboard */}
      <CohortAnalysisDashboard
        isOpen={showCohortAnalysisDashboard}
        onClose={() => setShowCohortAnalysisDashboard(false)}
        filters={cohortAnalysisFilters}
        onFiltersChange={setCohortAnalysisFilters}
      />

      {/* Conversion Rate Cohort Analysis Dashboard */}
      <CohortAnalysisDashboard
        isOpen={showConversionCohortDashboard}
        onClose={() => setShowConversionCohortDashboard(false)}
        filters={conversionCohortFilters}
        onFiltersChange={setConversionCohortFilters}
      />

      {/* Retention Detail Dashboard */}
      <RetentionDetailDashboard
        isOpen={showRetentionDetailDashboard}
        onClose={() => setShowRetentionDetailDashboard(false)}
        filters={retentionFilters}
        onFiltersChange={setRetentionFilters}
      />
    </div>
  );
};

export default FunnelDashboard; 