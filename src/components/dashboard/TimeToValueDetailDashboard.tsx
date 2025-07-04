import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Clock, 
  X, 
  Calendar, 
  Users, 
  MapPin, 
  Badge, 
  Settings,
  TrendingUp,
  Timer,
  BarChart3,
  Target
} from 'lucide-react';

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

interface TimeToValueData {
  profession: string;
  avgTimeToValue: number; // in days
  totalAccounts: number;
}

interface TimeToValueDetailDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TimeToValueFilters;
  onFiltersChange: (filters: TimeToValueFilters) => void;
}

const generateMockTimeToValueData = (filters: TimeToValueFilters): TimeToValueData[] => {
  const professions = ['Doctor', 'Nurse', 'Therapist', 'Administrator', 'Specialist'];
  
  return professions.map(profession => {
    const totalAccounts = Math.floor(Math.random() * 200) + 50; // 50-250 accounts
    const avgTimeToValue = Math.floor(Math.random() * 20) + 5; // 5-25 days
    
    return {
      profession,
      avgTimeToValue,
      totalAccounts
    };
  });
};

const TimeToValueDetailDashboard: React.FC<TimeToValueDetailDashboardProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [timeToValueData, setTimeToValueData] = useState<TimeToValueData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockData = generateMockTimeToValueData(filters);
        setTimeToValueData(mockData);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!loading && timeToValueData.length > 0 && svgRef.current) {
      drawChart();
    }
  }, [timeToValueData, loading]);

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
      .domain(timeToValueData.map(d => d.profession))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timeToValueData, d => d.avgTimeToValue) || 0])
      .range([height, 0]);



    // Create bars for average time to value
    g.selectAll('.bar-time')
      .data(timeToValueData)
      .enter().append('rect')
      .attr('class', 'bar-time')
      .attr('x', d => xScale(d.profession) || 0)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 2)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.avgTimeToValue))
      .attr('height', d => height - yScale(d.avgTimeToValue));

    // Create bars for total accounts
    const accountsScale = d3.scaleLinear()
      .domain([0, d3.max(timeToValueData, d => d.totalAccounts) || 0])
      .range([0, height / 2]); // Scale to half chart height

    g.selectAll('.bar-accounts')
      .data(timeToValueData)
      .enter().append('rect')
      .attr('class', 'bar-accounts')
      .attr('x', d => (xScale(d.profession) || 0) + xScale.bandwidth() / 2)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 2)
      .attr('height', 0)
      .attr('fill', '#10b981')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => height - accountsScale(d.totalAccounts))
      .attr('height', d => accountsScale(d.totalAccounts));



    // Add text labels for time to value
    g.selectAll('.text-time')
      .data(timeToValueData)
      .enter().append('text')
      .attr('class', 'text-time')
      .attr('x', d => (xScale(d.profession) || 0) + xScale.bandwidth() / 4)
      .attr('y', d => yScale(d.avgTimeToValue) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text(d => `${d.avgTimeToValue}d`)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for total accounts
    g.selectAll('.text-accounts')
      .data(timeToValueData)
      .enter().append('text')
      .attr('class', 'text-accounts')
      .attr('x', d => (xScale(d.profession) || 0) + (3 * xScale.bandwidth() / 4))
      .attr('y', d => height - accountsScale(d.totalAccounts) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#10b981')
      .text(d => d.totalAccounts.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);



    // Add X-axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add left Y-axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text('Avg Time to Value (Days)');



    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(20, 20)`);

    const legendItems = [
      { name: 'Avg Time to Value (Days)', color: '#3b82f6' },
      { name: 'Total Accounts', color: '#10b981' }
    ];

    legendItems.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      // Rectangle for bars
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
    g.selectAll('.bar-time, .bar-accounts')
      .on('mouseover', function(event: any, d: unknown) {
        const data = d as TimeToValueData;
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
          Profession: ${data.profession}<br/>
          Avg Time to Value: ${data.avgTimeToValue} days<br/>
          Total Accounts: ${data.totalAccounts}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        d3.selectAll('.tooltip').remove();
      });
  };

  const updateFilters = (updates: Partial<TimeToValueFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const getTotalStats = () => {
    const totalAccounts = timeToValueData.reduce((sum, d) => sum + d.totalAccounts, 0);
    const avgTimeToValue = timeToValueData.reduce((sum, d) => sum + d.avgTimeToValue, 0) / timeToValueData.length;

    return { totalAccounts, avgTimeToValue };
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
                <Clock className="h-5 w-5 text-blue-600" />
                Time to Value Analysis
              </CardTitle>
              <CardDescription>
                Analyze time to value metrics across different professions
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Avg Time to Value</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.avgTimeToValue.toFixed(1)} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Total Accounts</p>
                      <p className="text-2xl font-bold text-green-700">{stats.totalAccounts}</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Time to Value Analysis by Profession
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

export default TimeToValueDetailDashboard; 