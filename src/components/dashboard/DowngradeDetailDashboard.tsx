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
  ArrowDown,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

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

interface DowngradeData {
  category: string;
  appointmentsBeforeDowngrade: number;
  appointmentsAfterDowngrade: number;
  accountsDowngraded: number;
  reductionPercentage: number;
}

interface DowngradeDetailDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DowngradeFilters;
  onFiltersChange: (filters: DowngradeFilters) => void;
}

const generateMockDowngradeData = (filters: DowngradeFilters): DowngradeData[] => {
  const categories = filters.xAxis === 'profession' 
    ? ['Doctor', 'Nurse', 'Therapist', 'Administrator', 'Specialist']
    : filters.xAxis === 'country'
    ? ['USA', 'Canada', 'UK', 'Australia', 'Germany']
    : ['Basic', 'Premium', 'Enterprise', 'Pro', 'Starter'];

  return categories.map(category => {
    const beforeDowngrade = Math.floor(Math.random() * 150) + 100; // 100-250 appointments
    const reductionRate = Math.random() * 0.5 + 0.1; // 10-60% reduction
    const afterDowngrade = Math.floor(beforeDowngrade * (1 - reductionRate));
    const accountsDowngraded = Math.floor(Math.random() * 20) + 3; // 3-23 accounts
    
    return {
      category,
      appointmentsBeforeDowngrade: beforeDowngrade,
      appointmentsAfterDowngrade: afterDowngrade,
      accountsDowngraded,
      reductionPercentage: reductionRate * 100
    };
  });
};

const DowngradeDetailDashboard: React.FC<DowngradeDetailDashboardProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [downgradeData, setDowngradeData] = useState<DowngradeData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockData = generateMockDowngradeData(filters);
        setDowngradeData(mockData);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!loading && downgradeData.length > 0 && svgRef.current) {
      drawChart();
    }
  }, [downgradeData, loading]);

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
      .domain(downgradeData.map(d => d.category))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(downgradeData, d => Math.max(d.appointmentsBeforeDowngrade, d.appointmentsAfterDowngrade)) || 0])
      .range([height, 0]);

    // Create bars for appointments before downgrade
    g.selectAll('.bar-before')
      .data(downgradeData)
      .enter().append('rect')
      .attr('class', 'bar-before')
      .attr('x', d => xScale(d.category) || 0)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.appointmentsBeforeDowngrade))
      .attr('height', d => height - yScale(d.appointmentsBeforeDowngrade));

    // Create bars for appointments after downgrade
    g.selectAll('.bar-after')
      .data(downgradeData)
      .enter().append('rect')
      .attr('class', 'bar-after')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 3)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.appointmentsAfterDowngrade))
      .attr('height', d => height - yScale(d.appointmentsAfterDowngrade));

    // Create bars for accounts downgraded (scaled for visibility)
    const accountsScale = d3.scaleLinear()
      .domain([0, d3.max(downgradeData, d => d.accountsDowngraded) || 0])
      .range([0, height / 3]); // Scale to 1/3 of chart height

    g.selectAll('.bar-accounts')
      .data(downgradeData)
      .enter().append('rect')
      .attr('class', 'bar-accounts')
      .attr('x', d => (xScale(d.category) || 0) + (2 * xScale.bandwidth() / 3))
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#f59e0b')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => height - accountsScale(d.accountsDowngraded))
      .attr('height', d => accountsScale(d.accountsDowngraded));

    // Add text labels for before downgrade
    g.selectAll('.text-before')
      .data(downgradeData)
      .enter().append('text')
      .attr('class', 'text-before')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 6)
      .attr('y', d => yScale(d.appointmentsBeforeDowngrade) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text(d => d.appointmentsBeforeDowngrade.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for after downgrade
    g.selectAll('.text-after')
      .data(downgradeData)
      .enter().append('text')
      .attr('class', 'text-after')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.appointmentsAfterDowngrade) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#ef4444')
      .text(d => d.appointmentsAfterDowngrade.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for accounts downgraded
    g.selectAll('.text-accounts')
      .data(downgradeData)
      .enter().append('text')
      .attr('class', 'text-accounts')
      .attr('x', d => (xScale(d.category) || 0) + (5 * xScale.bandwidth() / 6))
      .attr('y', d => height - accountsScale(d.accountsDowngraded) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#f59e0b')
      .text(d => d.accountsDowngraded.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add reduction percentage labels
    g.selectAll('.text-reduction')
      .data(downgradeData)
      .enter().append('text')
      .attr('class', 'text-reduction')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.appointmentsAfterDowngrade) - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#dc2626')
      .text(d => `-${d.reductionPercentage.toFixed(0)}%`)
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
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text('Appointments per Month');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 200}, 20)`);

    const legendItems = [
      { name: 'Before Downgrade', color: '#3b82f6' },
      { name: 'After Downgrade', color: '#ef4444' },
      { name: 'Accounts Downgraded', color: '#f59e0b' }
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
    g.selectAll('.bar-before, .bar-after, .bar-accounts')
      .on('mouseover', function(event: any, d: unknown) {
        const data = d as DowngradeData;
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
          Category: ${data.category}<br/>
          Before Downgrade: ${data.appointmentsBeforeDowngrade} appointments/month<br/>
          After Downgrade: ${data.appointmentsAfterDowngrade} appointments/month<br/>
          Accounts Downgraded: ${data.accountsDowngraded}<br/>
          Reduction: -${data.reductionPercentage.toFixed(1)}%<br/>
          Lost Appointments: -${data.appointmentsBeforeDowngrade - data.appointmentsAfterDowngrade}/month
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        d3.selectAll('.tooltip').remove();
      });
  };

  const updateFilters = (updates: Partial<DowngradeFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const getTotalStats = () => {
    const totalAccountsDowngraded = downgradeData.reduce((sum, d) => sum + d.accountsDowngraded, 0);
    const totalAppointmentsBefore = downgradeData.reduce((sum, d) => sum + d.appointmentsBeforeDowngrade, 0);
    const totalAppointmentsAfter = downgradeData.reduce((sum, d) => sum + d.appointmentsAfterDowngrade, 0);
    const lostAppointments = totalAppointmentsBefore - totalAppointmentsAfter;
    const avgReduction = downgradeData.reduce((sum, d) => sum + d.reductionPercentage, 0) / downgradeData.length;

    return { totalAccountsDowngraded, lostAppointments, avgReduction };
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
                Plan Downgrading Analysis
              </CardTitle>
              <CardDescription>
                Track appointment reductions from plan downgrades and their impact
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
                    <ArrowDown className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600">Accounts Downgraded</p>
                      <p className="text-2xl font-bold text-red-700">{stats.totalAccountsDowngraded}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600">Lost Appointments/Month</p>
                      <p className="text-2xl font-bold text-orange-700">-{stats.lostAppointments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-yellow-600">Avg Reduction</p>
                      <p className="text-2xl font-bold text-yellow-700">-{stats.avgReduction.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4 text-gray-800">Date Range & Filters</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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

                {/* X-Axis Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BarChart3 className="h-4 w-4 inline mr-1" />
                    Group By (X-Axis)
                  </label>
                  <select
                    value={filters.xAxis}
                    onChange={(e) => updateFilters({
                      xAxis: e.target.value as 'profession' | 'country' | 'membership'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="profession">Profession</option>
                    <option value="country">Country</option>
                    <option value="membership">Membership</option>
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

            {/* Chart Section */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold mb-4 text-gray-800">
                Downgrading Impact by {filters.xAxis.charAt(0).toUpperCase() + filters.xAxis.slice(1)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DowngradeDetailDashboard; 