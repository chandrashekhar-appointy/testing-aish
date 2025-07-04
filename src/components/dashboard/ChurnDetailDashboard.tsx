import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  TrendingDown, 
  X, 
  Calendar, 
  Users, 
  MapPin, 
  Badge, 
  Settings,
  AlertTriangle
} from 'lucide-react';

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

interface ChurnData {
  period: string;
  accountsChurned: number;
  appointmentsChurned: number;
  churnRate: number;
}

interface ChurnDetailDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ChurnFilters;
  onFiltersChange: (filters: ChurnFilters) => void;
}

interface ChurnCohortData {
  cohortName: string;
  cohortDate: string;
  totalUsers: number;
  churnRateByWeek: number[]; // Percentage of users who churned each week
}

const generateMockChurnCohortData = (filters: ChurnFilters, cohortRange: '3months' | '6months' | '12months' = '6months'): ChurnCohortData[] => {
  const cohorts = [];
  const today = new Date();
  
  const rangeToMonths = {
    '3months': 3,
    '6months': 6,
    '12months': 12
  };
  
  const monthsCount = rangeToMonths[cohortRange];
  
  for (let i = monthsCount - 1; i >= 0; i--) {
    const cohortDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const cohortName = cohortDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const totalUsers = Math.floor(Math.random() * 200) + 100; // 100-300 users
    
    // Generate churn rate by week (cumulative churn percentage)
    const churnRateByWeek = [];
    let cumulativeChurn = 0;
    for (let week = 0; week < 8; week++) {
      const weeklyChurnRate = Math.random() * 5 + 2; // 2-7% weekly churn
      cumulativeChurn += weeklyChurnRate;
      churnRateByWeek.push(Math.min(cumulativeChurn, 45)); // Cap at 45% total churn
    }
    
    cohorts.push({
      cohortName,
      cohortDate: cohortDate.toISOString().split('T')[0],
      totalUsers,
      churnRateByWeek
    });
  }
  
  return cohorts;
};

const ChurnCohortChart: React.FC<{ filters: ChurnFilters }> = ({ filters }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cohortData, setCohortData] = useState<ChurnCohortData[]>([]);
  const [cohortRange, setCohortRange] = useState<'3months' | '6months' | '12months'>('6months');

  useEffect(() => {
    const mockData = generateMockChurnCohortData(filters, cohortRange);
    setCohortData(mockData);
  }, [filters, cohortRange]);

  useEffect(() => {
    if (cohortData.length > 0 && svgRef.current) {
      drawCohortChart();
    }
  }, [cohortData]);

  const drawCohortChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 120, bottom: 100, left: 150 };
    const cellWidth = 60;
    const cellHeight = 40;
    const width = cellWidth * 8 + margin.left + margin.right;
    const height = cellHeight * cohortData.length + margin.top + margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale for churn rates (red scale)
    const colorScale = d3.scaleSequential(d3.interpolateReds)
      .domain([0, 45]);

    // Create cohort heatmap
    cohortData.forEach((cohort, cohortIndex) => {
      cohort.churnRateByWeek.forEach((rate, weekIndex) => {
        const rect = g.append('rect')
          .attr('x', weekIndex * cellWidth)
          .attr('y', cohortIndex * cellHeight)
          .attr('width', cellWidth - 2)
          .attr('height', cellHeight - 2)
          .attr('fill', colorScale(rate))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('opacity', 0)
          .on('mouseover', function(event) {
            // Tooltip
            const tooltip = d3.select('body').append('div')
              .attr('class', 'tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(0,0,0,0.8)')
              .style('color', 'white')
              .style('padding', '8px')
              .style('border-radius', '4px')
              .style('font-size', '12px')
              .style('pointer-events', 'none')
              .style('opacity', 0);

            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`Cohort: ${cohort.cohortName}<br/>Week ${weekIndex + 1}<br/>Cumulative Churn: ${rate.toFixed(1)}%`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');

            d3.select(this).attr('opacity', 1).attr('stroke-width', 2);
          })
          .on('mouseout', function() {
            d3.selectAll('.tooltip').remove();
            d3.select(this).attr('opacity', 1).attr('stroke-width', 1);
          });

        // Animate cell appearance
        rect.transition()
          .duration(500)
          .delay(cohortIndex * 100 + weekIndex * 50)
          .attr('opacity', 1);

        // Add text labels
        g.append('text')
          .attr('x', weekIndex * cellWidth + cellWidth / 2)
          .attr('y', cohortIndex * cellHeight + cellHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', '10px')
          .attr('fill', rate > 25 ? 'white' : 'black')
          .attr('opacity', 0)
          .text(`${rate.toFixed(0)}%`)
          .transition()
          .duration(500)
          .delay(cohortIndex * 100 + weekIndex * 50 + 200)
          .attr('opacity', 1);
      });
    });

    // Add cohort labels (Y-axis)
    g.selectAll('.cohort-label')
      .data(cohortData)
      .enter().append('text')
      .attr('class', 'cohort-label')
      .attr('x', -10)
      .attr('y', (d, i) => i * cellHeight + cellHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text(d => d.cohortName);

    // Add week labels (X-axis)
    g.selectAll('.week-label')
      .data(d3.range(8))
      .enter().append('text')
      .attr('class', 'week-label')
      .attr('x', d => d * cellWidth + cellWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text(d => `Week ${d + 1}`);

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${8 * cellWidth + 20}, 0)`);

    const legendScale = d3.scaleLinear()
      .domain([0, 45])
      .range([0, 200]);

    const legendAxis = d3.axisRight(legendScale)
      .tickFormat(d => `${d}%`);

    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'churn-legend-gradient')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');

    gradient.selectAll('stop')
      .data(d3.range(0, 46, 5))
      .enter().append('stop')
      .attr('offset', d => `${(d / 45) * 100}%`)
      .attr('stop-color', d => colorScale(d));

    legend.append('rect')
      .attr('width', 20)
      .attr('height', 200)
      .style('fill', 'url(#churn-legend-gradient)');

    legend.append('g')
      .attr('transform', 'translate(20, 0)')
      .call(legendAxis);

    legend.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -100)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text('Cumulative Churn Rate (%)');
  };

  return (
    <div className="space-y-4">
      {/* Cohort Range Selection */}
      <div className="flex gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 mr-2">Cohort Range:</span>
        <button
          onClick={() => setCohortRange('3months')}
          className={`px-3 py-1 text-xs rounded ${
            cohortRange === '3months' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          3 Months
        </button>
        <button
          onClick={() => setCohortRange('6months')}
          className={`px-3 py-1 text-xs rounded ${
            cohortRange === '6months' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          6 Months
        </button>
        <button
          onClick={() => setCohortRange('12months')}
          className={`px-3 py-1 text-xs rounded ${
            cohortRange === '12months' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          12 Months
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <svg ref={svgRef} className="w-full h-auto" />
      </div>
    </div>
  );
};

const generateMockChurnData = (filters: ChurnFilters): ChurnData[] => {
  const { period } = filters.timeRange;
  
  // Generate different data points based on time period
  const dataPoints = period === '1month' ? 4 : 
                    period === '3months' ? 12 : 
                    period === '6months' ? 24 : 52;
  
  const timeUnit = period === '1month' ? 'Week' : 
                  period === '3months' ? 'Week' : 
                  period === '6months' ? 'Week' : 'Week';

  return Array.from({ length: dataPoints }, (_, i) => {
    const baseAccounts = Math.floor(Math.random() * 50) + 10;
    const baseAppointments = baseAccounts * (Math.floor(Math.random() * 8) + 3);
    
    return {
      period: `${timeUnit} ${i + 1}`,
      accountsChurned: baseAccounts,
      appointmentsChurned: baseAppointments,
      churnRate: Math.random() * 0.15 + 0.02 // 2-17% churn rate
    };
  });
};

const ChurnDetailDashboard: React.FC<ChurnDetailDashboardProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [churnData, setChurnData] = useState<ChurnData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockData = generateMockChurnData(filters);
        setChurnData(mockData);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!loading && churnData.length > 0 && svgRef.current) {
      drawChart();
    }
  }, [churnData, loading]);

  const drawChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 80, bottom: 140, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(churnData.map(d => d.period))
      .range([0, width])
      .padding(0.3);

    const yScaleLeft = d3.scaleLinear()
      .domain([0, d3.max(churnData, d => Math.max(d.accountsChurned, d.appointmentsChurned)) || 0])
      .range([height, 0]);

    const yScaleRight = d3.scaleLinear()
      .domain([0, d3.max(churnData, d => d.churnRate) || 0])
      .range([height, 0]);

    // Create bars for accounts churned
    g.selectAll('.bar-accounts')
      .data(churnData)
      .enter().append('rect')
      .attr('class', 'bar-accounts')
      .attr('x', d => xScale(d.period) || 0)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScaleLeft(d.accountsChurned))
      .attr('height', d => height - yScaleLeft(d.accountsChurned));

    // Create bars for appointments churned
    g.selectAll('.bar-appointments')
      .data(churnData)
      .enter().append('rect')
      .attr('class', 'bar-appointments')
      .attr('x', d => (xScale(d.period) || 0) + xScale.bandwidth() / 3)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#dc2626')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScaleLeft(d.appointmentsChurned))
      .attr('height', d => height - yScaleLeft(d.appointmentsChurned));

    // Create line for churn rate
    const line = d3.line<ChurnData>()
      .x(d => (xScale(d.period) || 0) + xScale.bandwidth() / 2)
      .y(d => yScaleRight(d.churnRate))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(churnData)
      .attr('class', 'line-churn-rate')
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Animate line
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .attr('stroke-dashoffset', 0);

    // Add circles for churn rate points
    g.selectAll('.circle-churn-rate')
      .data(churnData)
      .enter().append('circle')
      .attr('class', 'circle-churn-rate')
      .attr('cx', d => (xScale(d.period) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScaleRight(d.churnRate))
      .attr('r', 0)
      .attr('fill', '#f59e0b')
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1000)
      .attr('r', 5);

    // Add text labels for accounts churned
    g.selectAll('.text-accounts')
      .data(churnData)
      .enter().append('text')
      .attr('class', 'text-accounts')
      .attr('x', d => (xScale(d.period) || 0) + xScale.bandwidth() / 6)
      .attr('y', d => yScaleLeft(d.accountsChurned) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#ef4444')
      .text(d => d.accountsChurned.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for appointments churned
    g.selectAll('.text-appointments')
      .data(churnData)
      .enter().append('text')
      .attr('class', 'text-appointments')
      .attr('x', d => (xScale(d.period) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScaleLeft(d.appointmentsChurned) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#dc2626')
      .text(d => d.appointmentsChurned.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for churn rate
    g.selectAll('.text-churn-rate')
      .data(churnData)
      .enter().append('text')
      .attr('class', 'text-churn-rate')
      .attr('x', d => (xScale(d.period) || 0) + xScale.bandwidth() / 2 + 15)
      .attr('y', d => yScaleRight(d.churnRate) + 3)
      .attr('text-anchor', 'start')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#f59e0b')
      .text(d => `${(d.churnRate * 100).toFixed(1)}%`)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1200)
      .attr('opacity', 1);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g')
      .call(d3.axisLeft(yScaleLeft))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text('Count');

    g.append('g')
      .attr('transform', `translate(${width},0)`)
      .call(d3.axisRight(yScaleRight).tickFormat(d3.format('.1%')))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text('Churn Rate');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 180}, 20)`);

    const legendItems = [
      { name: 'Accounts Churned', color: '#ef4444' },
      { name: 'Appointments Churned', color: '#dc2626' },
      { name: 'Churn Rate', color: '#f59e0b' }
    ];

    legendItems.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', item.color)
        .attr('opacity', 0.8);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .text(item.name);
    });

    // Add hover effects
    g.selectAll('.bar-accounts, .bar-appointments')
      .on('mouseover', function(event: any, d: unknown) {
        const data = d as ChurnData;
        d3.select(this).attr('opacity', 1);
        
        // Create tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none');

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          Period: ${data.period}<br/>
          Accounts Churned: ${data.accountsChurned}<br/>
          Appointments Churned: ${data.appointmentsChurned}<br/>
          Churn Rate: ${(data.churnRate * 100).toFixed(1)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        d3.selectAll('.tooltip').remove();
      });
  };

  const updateFilters = (updates: Partial<ChurnFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleTimeRangeChange = (period: '1month' | '3months' | '6months' | '1year') => {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    updateFilters({
      timeRange: {
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }
    });
  };

  const getTotalStats = () => {
    const totalAccounts = churnData.reduce((sum, d) => sum + d.accountsChurned, 0);
    const totalAppointments = churnData.reduce((sum, d) => sum + d.appointmentsChurned, 0);
    const avgChurnRate = churnData.reduce((sum, d) => sum + d.churnRate, 0) / churnData.length;

    return { totalAccounts, totalAppointments, avgChurnRate };
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
                <TrendingDown className="h-5 w-5 text-red-600" />
                Customer Churn Analysis
              </CardTitle>
              <CardDescription>
                Track accounts and appointments lost over time with detailed metrics
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600">Total Accounts Churned</p>
                      <p className="text-2xl font-bold text-red-700">{stats.totalAccounts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600">Appointments Lost</p>
                      <p className="text-2xl font-bold text-orange-700">{stats.totalAppointments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-yellow-600">Avg Churn Rate</p>
                      <p className="text-2xl font-bold text-yellow-700">{(stats.avgChurnRate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4 text-gray-800">Time Range & Filters</h4>
              
              {/* Time Range Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Time Period
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: '1month', label: '1 Month' },
                    { key: '3months', label: '3 Months' },
                    { key: '6months', label: '6 Months' },
                    { key: '1year', label: '1 Year' }
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={filters.timeRange.period === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeRangeChange(key as any)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <h4 className="font-semibold mb-4 text-gray-800">
                Churn Trends - {filters.timeRange.period.replace(/(\d+)/, '$1 ')}
              </h4>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <svg
                    ref={svgRef}
                    width={1000}
                    height={500}
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>

            {/* Cohort Analysis Section */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold mb-4 text-gray-800">
                Customer Churn Cohort Analysis
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Track churn rates by cohort to identify patterns in customer lifecycle behavior
              </p>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ChurnCohortChart filters={filters} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChurnDetailDashboard; 