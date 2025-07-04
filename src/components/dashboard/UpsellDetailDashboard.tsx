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
  ArrowUp,
  BarChart3
} from 'lucide-react';

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

interface UpsellData {
  category: string;
  appointmentsBeforeUpsell: number;
  appointmentsAfterUpsell: number;
  accountsUpsold: number;
  improvementPercentage: number;
}

interface UpsellDetailDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  filters: UpsellFilters;
  onFiltersChange: (filters: UpsellFilters) => void;
}

const generateMockUpsellData = (filters: UpsellFilters): UpsellData[] => {
  const categories = filters.xAxis === 'profession' 
    ? ['Doctor', 'Nurse', 'Therapist', 'Administrator', 'Specialist']
    : filters.xAxis === 'country'
    ? ['USA', 'Canada', 'UK', 'Australia', 'Germany']
    : ['Basic', 'Premium', 'Enterprise', 'Pro', 'Starter'];

  return categories.map(category => {
    const beforeUpsell = Math.floor(Math.random() * 150) + 50; // 50-200 appointments
    const improvementRate = Math.random() * 0.8 + 0.2; // 20-100% improvement
    const afterUpsell = Math.floor(beforeUpsell * (1 + improvementRate));
    const accountsUpsold = Math.floor(Math.random() * 25) + 5; // 5-30 accounts
    
    return {
      category,
      appointmentsBeforeUpsell: beforeUpsell,
      appointmentsAfterUpsell: afterUpsell,
      accountsUpsold,
      improvementPercentage: improvementRate * 100
    };
  });
};

const UpsellDetailDashboard: React.FC<UpsellDetailDashboardProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [upsellData, setUpsellData] = useState<UpsellData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockData = generateMockUpsellData(filters);
        setUpsellData(mockData);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!loading && upsellData.length > 0 && svgRef.current) {
      drawChart();
    }
  }, [upsellData, loading]);

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
      .domain(upsellData.map(d => d.category))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(upsellData, d => Math.max(d.appointmentsBeforeUpsell, d.appointmentsAfterUpsell)) || 0])
      .range([height, 0]);

    // Create bars for appointments before upsell
    g.selectAll('.bar-before')
      .data(upsellData)
      .enter().append('rect')
      .attr('class', 'bar-before')
      .attr('x', d => xScale(d.category) || 0)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#94a3b8')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.appointmentsBeforeUpsell))
      .attr('height', d => height - yScale(d.appointmentsBeforeUpsell));

    // Create bars for appointments after upsell
    g.selectAll('.bar-after')
      .data(upsellData)
      .enter().append('rect')
      .attr('class', 'bar-after')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 3)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#10b981')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.appointmentsAfterUpsell))
      .attr('height', d => height - yScale(d.appointmentsAfterUpsell));

    // Create bars for accounts upsold (scaled for visibility)
    const accountsScale = d3.scaleLinear()
      .domain([0, d3.max(upsellData, d => d.accountsUpsold) || 0])
      .range([0, height / 3]); // Scale to 1/3 of chart height

    g.selectAll('.bar-accounts')
      .data(upsellData)
      .enter().append('rect')
      .attr('class', 'bar-accounts')
      .attr('x', d => (xScale(d.category) || 0) + (2 * xScale.bandwidth() / 3))
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => height - accountsScale(d.accountsUpsold))
      .attr('height', d => accountsScale(d.accountsUpsold));

    // Add text labels for before upsell
    g.selectAll('.text-before')
      .data(upsellData)
      .enter().append('text')
      .attr('class', 'text-before')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 6)
      .attr('y', d => yScale(d.appointmentsBeforeUpsell) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#94a3b8')
      .text(d => d.appointmentsBeforeUpsell.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for after upsell
    g.selectAll('.text-after')
      .data(upsellData)
      .enter().append('text')
      .attr('class', 'text-after')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.appointmentsAfterUpsell) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#10b981')
      .text(d => d.appointmentsAfterUpsell.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for accounts upsold
    g.selectAll('.text-accounts')
      .data(upsellData)
      .enter().append('text')
      .attr('class', 'text-accounts')
      .attr('x', d => (xScale(d.category) || 0) + (5 * xScale.bandwidth() / 6))
      .attr('y', d => height - accountsScale(d.accountsUpsold) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text(d => d.accountsUpsold.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add improvement percentage labels
    g.selectAll('.text-improvement')
      .data(upsellData)
      .enter().append('text')
      .attr('class', 'text-improvement')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.appointmentsAfterUpsell) - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#059669')
      .text(d => `+${d.improvementPercentage.toFixed(0)}%`)
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
      { name: 'Before Upsell', color: '#94a3b8' },
      { name: 'After Upsell', color: '#10b981' },
      { name: 'Accounts Upsold', color: '#3b82f6' }
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
        const data = d as UpsellData;
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
          Before Upsell: ${data.appointmentsBeforeUpsell} appointments/month<br/>
          After Upsell: ${data.appointmentsAfterUpsell} appointments/month<br/>
          Accounts Upsold: ${data.accountsUpsold}<br/>
          Improvement: +${data.improvementPercentage.toFixed(1)}%<br/>
          Additional Appointments: +${data.appointmentsAfterUpsell - data.appointmentsBeforeUpsell}/month
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        d3.selectAll('.tooltip').remove();
      });
  };

  const updateFilters = (updates: Partial<UpsellFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const getTotalStats = () => {
    const totalAccountsUpsold = upsellData.reduce((sum, d) => sum + d.accountsUpsold, 0);
    const totalAppointmentsBefore = upsellData.reduce((sum, d) => sum + d.appointmentsBeforeUpsell, 0);
    const totalAppointmentsAfter = upsellData.reduce((sum, d) => sum + d.appointmentsAfterUpsell, 0);
    const additionalAppointments = totalAppointmentsAfter - totalAppointmentsBefore;
    const avgImprovement = upsellData.reduce((sum, d) => sum + d.improvementPercentage, 0) / upsellData.length;

    return { totalAccountsUpsold, additionalAppointments, avgImprovement };
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
                Upselling Analysis
              </CardTitle>
              <CardDescription>
                Track appointment increases from successful upselling initiatives
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Accounts Upsold</p>
                      <p className="text-2xl font-bold text-green-700">{stats.totalAccountsUpsold}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Additional Appointments/Month</p>
                      <p className="text-2xl font-bold text-blue-700">+{stats.additionalAppointments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600">Avg Improvement</p>
                      <p className="text-2xl font-bold text-purple-700">+{stats.avgImprovement.toFixed(1)}%</p>
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
                Upselling Impact by {filters.xAxis.charAt(0).toUpperCase() + filters.xAxis.slice(1)}
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

export default UpsellDetailDashboard; 