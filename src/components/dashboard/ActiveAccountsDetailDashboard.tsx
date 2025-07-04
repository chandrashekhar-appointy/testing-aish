import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  BarChart3, 
  X, 
  Calendar, 
  Users, 
  MapPin, 
  Badge, 
  Settings,
  Plus,
  Trash2
} from 'lucide-react';

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

interface ChartData {
  category: string;
  appointments: number;
  activeAccounts: number;
  bayesianNormal: number;
}

interface ActiveAccountsDetailDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DetailFilters;
  onFiltersChange: (filters: DetailFilters) => void;
}

const generateMockDetailData = (filters: DetailFilters): ChartData[] => {
  const categories = filters.xAxis === 'profession' 
    ? ['Doctor', 'Nurse', 'Therapist', 'Administrator', 'Specialist']
    : filters.xAxis === 'country'
    ? ['USA', 'Canada', 'UK', 'Australia', 'Germany']
    : filters.xAxis === 'membership'
    ? ['Basic', 'Premium', 'Enterprise', 'Pro', 'Starter']
    : filters.staffBuckets.map(bucket => bucket.name);

  return categories.map(category => ({
    category,
    appointments: Math.floor(Math.random() * 1000) + 200,
    activeAccounts: Math.floor(Math.random() * 800) + 100,
    bayesianNormal: Math.random() * 0.8 + 0.1
  }));
};

const ActiveAccountsDetailDashboard: React.FC<ActiveAccountsDetailDashboardProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockData = generateMockDetailData(filters);
        setChartData(mockData);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!loading && chartData.length > 0 && svgRef.current) {
      drawChart();
    }
  }, [chartData, loading]);

  const drawChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 80, bottom: 100, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(chartData.map(d => d.category))
      .range([0, width])
      .padding(0.3);

    const yScaleLeft = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => Math.max(d.appointments, d.activeAccounts)) || 0])
      .range([height, 0]);

    const yScaleRight = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Create bars for appointments
    g.selectAll('.bar-appointments')
      .data(chartData)
      .enter().append('rect')
      .attr('class', 'bar-appointments')
      .attr('x', d => xScale(d.category) || 0)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScaleLeft(d.appointments))
      .attr('height', d => height - yScaleLeft(d.appointments));

    // Create bars for active accounts
    g.selectAll('.bar-accounts')
      .data(chartData)
      .enter().append('rect')
      .attr('class', 'bar-accounts')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 3)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 3)
      .attr('height', 0)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScaleLeft(d.activeAccounts))
      .attr('height', d => height - yScaleLeft(d.activeAccounts));

    // Create line for bayesian normal
    const line = d3.line<ChartData>()
      .x(d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .y(d => yScaleRight(d.bayesianNormal))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(chartData)
      .attr('class', 'line-bayesian')
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

    // Add circles for bayesian normal points
    g.selectAll('.circle-bayesian')
      .data(chartData)
      .enter().append('circle')
      .attr('class', 'circle-bayesian')
      .attr('cx', d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScaleRight(d.bayesianNormal))
      .attr('r', 0)
      .attr('fill', '#f59e0b')
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1000)
      .attr('r', 5);

    // Add text labels for appointments bars
    g.selectAll('.text-appointments')
      .data(chartData)
      .enter().append('text')
      .attr('class', 'text-appointments')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 6)
      .attr('y', d => yScaleLeft(d.appointments) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text(d => d.appointments.toLocaleString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for active accounts bars
    g.selectAll('.text-accounts')
      .data(chartData)
      .enter().append('text')
      .attr('class', 'text-accounts')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScaleLeft(d.activeAccounts) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#ef4444')
      .text(d => d.activeAccounts.toLocaleString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for bayesian normal
    g.selectAll('.text-bayesian')
      .data(chartData)
      .enter().append('text')
      .attr('class', 'text-bayesian')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 2 + 15)
      .attr('y', d => yScaleRight(d.bayesianNormal) + 3)
      .attr('text-anchor', 'start')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#f59e0b')
      .text(d => d.bayesianNormal.toFixed(3))
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
      .call(d3.axisRight(yScaleRight))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text('Bayesian Normal');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 150}, 20)`);

    const legendItems = [
      { name: 'Appointments', color: '#3b82f6' },
      { name: 'Active Accounts', color: '#ef4444' },
      { name: 'Bayesian Normal', color: '#f59e0b' }
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

    // Add tooltips
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

    // Add hover effects
    g.selectAll('.bar-appointments, .bar-accounts')
      .on('mouseover', function(event: any, d: unknown) {
        const data = d as ChartData;
        d3.select(this).attr('opacity', 1);
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          Category: ${data.category}<br/>
          Appointments: ${data.appointments}<br/>
          Active Accounts: ${data.activeAccounts}<br/>
          Bayesian Normal: ${data.bayesianNormal.toFixed(3)}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Cleanup function for tooltip
    return () => {
      tooltip.remove();
    };
  };

  const updateFilters = (updates: Partial<DetailFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const addStaffBucket = () => {
    const newBucket: StaffBucket = {
      id: Date.now().toString(),
      name: `Bucket ${filters.staffBuckets.length + 1}`,
      min: 0,
      max: 50
    };
    updateFilters({
      staffBuckets: [...filters.staffBuckets, newBucket]
    });
  };

  const removeStaffBucket = (id: string) => {
    updateFilters({
      staffBuckets: filters.staffBuckets.filter(bucket => bucket.id !== id)
    });
  };

  const updateStaffBucket = (id: string, updates: Partial<StaffBucket>) => {
    updateFilters({
      staffBuckets: filters.staffBuckets.map(bucket =>
        bucket.id === id ? { ...bucket, ...updates } : bucket
      )
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Active Accounts - Detailed Analysis
              </CardTitle>
              <CardDescription>
                Interactive dashboard showing appointments, active accounts, and bayesian normal metrics
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Filters Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4 text-gray-800">Filters & Controls</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Signup Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.signupDateRange.start}
                      onChange={(e) => updateFilters({
                        signupDateRange: { ...filters.signupDateRange, start: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="date"
                      value={filters.signupDateRange.end}
                      onChange={(e) => updateFilters({
                        signupDateRange: { ...filters.signupDateRange, end: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

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

                {/* X-Axis Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X-Axis Grouping
                  </label>
                  <select
                    value={filters.xAxis}
                    onChange={(e) => updateFilters({
                      xAxis: e.target.value as 'profession' | 'country' | 'membership' | 'staffBuckets'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="profession">Profession</option>
                    <option value="country">Country</option>
                    <option value="membership">Membership</option>
                    <option value="staffBuckets">Staff Count Buckets</option>
                  </select>
                </div>
              </div>

              {/* Staff Buckets Management */}
              {filters.xAxis === 'staffBuckets' && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-800">Staff Count Buckets</h5>
                    <Button onClick={addStaffBucket} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Bucket
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {filters.staffBuckets.map((bucket) => (
                      <div key={bucket.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bucket.name}
                          onChange={(e) => updateStaffBucket(bucket.id, { name: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Bucket name"
                        />
                        <input
                          type="number"
                          value={bucket.min}
                          onChange={(e) => updateStaffBucket(bucket.id, { min: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Min"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          value={bucket.max}
                          onChange={(e) => updateStaffBucket(bucket.id, { max: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Max"
                        />
                        <Button 
                          onClick={() => removeStaffBucket(bucket.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold mb-4 text-gray-800">
                Metrics by {filters.xAxis.charAt(0).toUpperCase() + filters.xAxis.slice(1)}
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

export default ActiveAccountsDetailDashboard; 