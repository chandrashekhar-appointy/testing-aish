import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  TrendingUp, 
  X, 
  Calendar, 
  Users, 
  MapPin, 
  Badge, 
  Settings,
  Activity,
  Target,
  CheckCircle,
  BarChart3
} from 'lucide-react';

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

interface RetentionCohortData {
  cohortName: string;
  cohortDate: string;
  totalUsers: number;
  retentionByWeek: number[];
}

interface MonthlyAppointmentData {
  month: string;
  retainedAccounts: number;
  totalAppointments: number;
  avgAppointmentsPerAccount: number;
}

interface RetentionDetailDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  filters: RetentionFilters;
  onFiltersChange: (filters: RetentionFilters) => void;
}

const generateMockRetentionCohortData = (filters: RetentionFilters): RetentionCohortData[] => {
  const cohorts = [];
  const today = new Date();
  const isWeekly = filters.cohortPeriod === 'weekly';
  
  const rangeToMonths = {
    '3months': 3,
    '6months': 6,
    '12months': 12
  };
  
  const monthsCount = rangeToMonths[filters.cohortRange];
  const periodsCount = isWeekly ? Math.floor(monthsCount * 4.33) : monthsCount;
  
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
    
    const totalUsers = Math.floor(Math.random() * 200) + 100;
    
    // Generate retention by week (high retention rates)
    const retentionByWeek = [];
    let retentionRate = 100;
    for (let week = 0; week < 12; week++) {
      retentionRate *= (0.92 + Math.random() * 0.06); // 92-98% retention each week (high retention)
      retentionByWeek.push(retentionRate);
    }
    
    cohorts.push({
      cohortName,
      cohortDate: cohortDate.toISOString().split('T')[0],
      totalUsers,
      retentionByWeek
    });
  }
  
  return cohorts;
};

const generateMockMonthlyAppointmentData = (filters: RetentionFilters): MonthlyAppointmentData[] => {
  const months = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const retainedAccounts = Math.floor(Math.random() * 500) + 800; // 800-1300 retained accounts
    const avgAppointmentsPerAccount = 3 + Math.random() * 4; // 3-7 appointments per account
    const totalAppointments = Math.floor(retainedAccounts * avgAppointmentsPerAccount);
    
    months.push({
      month: monthName,
      retainedAccounts,
      totalAppointments,
      avgAppointmentsPerAccount
    });
  }
  
  return months;
};

const RetentionDetailDashboard: React.FC<RetentionDetailDashboardProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const retentionSvgRef = useRef<SVGSVGElement>(null);
  const appointmentSvgRef = useRef<SVGSVGElement>(null);
  const [retentionCohortData, setRetentionCohortData] = useState<RetentionCohortData[]>([]);
  const [appointmentData, setAppointmentData] = useState<MonthlyAppointmentData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockRetentionData = generateMockRetentionCohortData(filters);
        const mockAppointmentData = generateMockMonthlyAppointmentData(filters);
        setRetentionCohortData(mockRetentionData);
        setAppointmentData(mockAppointmentData);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!loading && retentionCohortData.length > 0 && retentionSvgRef.current) {
      drawRetentionChart();
    }
  }, [retentionCohortData, loading]);

  useEffect(() => {
    if (!loading && appointmentData.length > 0 && appointmentSvgRef.current) {
      drawAppointmentChart();
    }
  }, [appointmentData, loading]);

  const drawRetentionChart = () => {
    const svg = d3.select(retentionSvgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 200, bottom: 140, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Limit cohorts to show only the most recent 8 for better visibility
    const displayCohorts = retentionCohortData.slice(-8);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, 11])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([70, 100])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create lines for each cohort
    const line = d3.line<number>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    displayCohorts.forEach((cohort, cohortIndex) => {
      const path = g.append('path')
        .datum(cohort.retentionByWeek)
        .attr('class', `retention-line-${cohortIndex}`)
        .attr('fill', 'none')
        .attr('stroke', colorScale(cohortIndex.toString()))
        .attr('stroke-width', 3)
        .attr('d', line);

      // Animate the line
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1500)
        .delay(cohortIndex * 200)
        .attr('stroke-dashoffset', 0);

      // Add points
      g.selectAll(`.retention-points-${cohortIndex}`)
        .data(cohort.retentionByWeek)
        .enter().append('circle')
        .attr('class', `retention-points-${cohortIndex}`)
        .attr('cx', (d, i) => xScale(i))
        .attr('cy', d => yScale(d))
        .attr('r', 0)
        .attr('fill', colorScale(cohortIndex.toString()))
        .transition()
        .duration(500)
        .delay(cohortIndex * 200 + 1500)
        .attr('r', 4);
    });

    // Add X-axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `Week ${Number(d) + 1}`))
      .selectAll('text')
      .style('font-size', '12px');

    // Add Y-axis
    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text('Retention Rate (%)');

    // Add legend with proper spacing
    const legend = g.append('g')
      .attr('transform', `translate(${width + 20}, 20)`);

    displayCohorts.forEach((cohort, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 22})`);

      legendRow.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 8)
        .attr('y2', 8)
        .attr('stroke', colorScale(i.toString()))
        .attr('stroke-width', 3);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '11px')
        .style('font-weight', '500')
        .text(cohort.cohortName);
    });

    // Add hover effects
    g.selectAll('circle')
      .on('mouseover', function(event: any, d: unknown) {
        const retention = d as number;
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);
        
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
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`Retention: ${retention.toFixed(1)}%`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 4);
        d3.selectAll('.tooltip').remove();
      });
  };

  const drawAppointmentChart = () => {
    const svg = d3.select(appointmentSvgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 80, bottom: 140, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(appointmentData.map(d => d.month))
      .range([0, width])
      .padding(0.3);

    const yScaleLeft = d3.scaleLinear()
      .domain([0, d3.max(appointmentData, d => d.totalAppointments) || 0])
      .range([height, 0]);

    const yScaleRight = d3.scaleLinear()
      .domain([0, d3.max(appointmentData, d => d.retainedAccounts) || 0])
      .range([height, 0]);

    // Create bars for total appointments
    g.selectAll('.bar-appointments')
      .data(appointmentData)
      .enter().append('rect')
      .attr('class', 'bar-appointments')
      .attr('x', d => xScale(d.month) || 0)
      .attr('y', height)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', '#22c55e')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScaleLeft(d.totalAppointments))
      .attr('height', d => height - yScaleLeft(d.totalAppointments));

    // Create line for retained accounts
    const line = d3.line<MonthlyAppointmentData>()
      .x(d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .y(d => yScaleRight(d.retainedAccounts))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(appointmentData)
      .attr('class', 'line-retained-accounts')
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
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

    // Add circles for retained accounts points
    g.selectAll('.circle-retained-accounts')
      .data(appointmentData)
      .enter().append('circle')
      .attr('class', 'circle-retained-accounts')
      .attr('cx', d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScaleRight(d.retainedAccounts))
      .attr('r', 0)
      .attr('fill', '#3b82f6')
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1000)
      .attr('r', 5);

    // Add X-axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '10px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add left Y-axis (appointments)
    g.append('g')
      .call(d3.axisLeft(yScaleLeft).tickFormat(d => d3.format('.0s')(d as number)))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#22c55e')
      .text('Total Appointments');

    // Add right Y-axis (retained accounts)
    g.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleRight))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#3b82f6')
      .text('Retained Accounts');

    // Add data labels
    g.selectAll('.text-appointments')
      .data(appointmentData)
      .enter().append('text')
      .attr('class', 'text-appointments')
      .attr('x', d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScaleLeft(d.totalAppointments) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#22c55e')
      .attr('opacity', 0)
      .text(d => d3.format('.1s')(d.totalAppointments))
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);
  };

  const updateFilters = (updates: Partial<RetentionFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const getTotalStats = () => {
    const avgRetention12Week = retentionCohortData.reduce((sum, d) => 
      sum + (d.retentionByWeek[11] || 0), 0) / retentionCohortData.length;
    const totalRetainedAccounts = appointmentData.reduce((sum, d) => sum + d.retainedAccounts, 0);
    const totalAppointments = appointmentData.reduce((sum, d) => sum + d.totalAppointments, 0);
    const avgAppointmentsPerAccount = totalAppointments / totalRetainedAccounts;

    return { avgRetention12Week, totalRetainedAccounts, totalAppointments, avgAppointmentsPerAccount };
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
                <TrendingUp className="h-5 w-5 text-green-600" />
                Customer Retention Analysis
              </CardTitle>
              <CardDescription>
                Analyze retention curves and appointment volume for retained customers
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">12-Week Retention</p>
                      <p className="text-2xl font-bold text-green-700">{stats.avgRetention12Week.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Retained Accounts</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.totalRetainedAccounts.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600">Total Appointments</p>
                      <p className="text-2xl font-bold text-purple-700">{stats.totalAppointments.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600">Avg Appts/Account</p>
                      <p className="text-2xl font-bold text-orange-700">{stats.avgAppointmentsPerAccount.toFixed(1)}</p>
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

            {/* Retention Curves Section */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div>
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

                  <h4 className="font-semibold mb-4 text-gray-800">
                    Retention Curves - {filters.cohortPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Cohorts
                  </h4>
                  <div className="overflow-x-auto">
                    <svg
                      ref={retentionSvgRef}
                      width={1000}
                      height={500}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Appointment Volume Section */}
            <div className="bg-white rounded-lg border p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold mb-4 text-gray-800">
                    Monthly Appointment Volume - Retained Accounts
                  </h4>
                  <div className="overflow-x-auto">
                    <svg
                      ref={appointmentSvgRef}
                      width={1000}
                      height={500}
                      className="w-full h-auto"
                    />
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

export default RetentionDetailDashboard; 