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
  ArrowDown,
  BarChart3,
  LineChart,
  Activity
} from 'lucide-react';

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

interface NegativeChurnData {
  month: string;
  appointmentsLost: number;
  appointmentsGained: number;
  netChange: number;
  negativeChurnRate: number;
}

interface NegativeChurnDetailDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  filters: NegativeChurnFilters;
  onFiltersChange: (filters: NegativeChurnFilters) => void;
}

interface NegativeChurnCohortData {
  cohortName: string;
  cohortDate: string;
  totalUsers: number;
  negativeChurnByWeek: number[]; // Percentage of users showing negative churn behavior each week
}

const generateMockNegativeChurnCohortData = (filters: NegativeChurnFilters, cohortRange: '3months' | '6months' | '12months' = '6months'): NegativeChurnCohortData[] => {
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
    
    const totalUsers = Math.floor(Math.random() * 100) + 50; // 50-150 users
    
    // Generate negative churn by week (percentage showing expansion behavior)
    const negativeChurnByWeek = [];
    let baseRate = 15 + Math.random() * 10; // Start with 15-25% base negative churn
    for (let week = 0; week < 8; week++) {
      baseRate *= (0.95 + Math.random() * 0.1); // Slight variation each week
      negativeChurnByWeek.push(Math.min(baseRate, 35)); // Cap at 35%
    }
    
    cohorts.push({
      cohortName,
      cohortDate: cohortDate.toISOString().split('T')[0],
      totalUsers,
      negativeChurnByWeek
    });
  }
  
  return cohorts;
};

const NegativeChurnCohortChart: React.FC<{ filters: NegativeChurnFilters }> = ({ filters }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cohortData, setCohortData] = useState<NegativeChurnCohortData[]>([]);
  const [cohortRange, setCohortRange] = useState<'3months' | '6months' | '12months'>('6months');

  useEffect(() => {
    const mockData = generateMockNegativeChurnCohortData(filters, cohortRange);
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

    // Color scale for negative churn rates
    const colorScale = d3.scaleSequential(d3.interpolateGreens)
      .domain([0, 35]);

    // Create cohort heatmap
    cohortData.forEach((cohort, cohortIndex) => {
      cohort.negativeChurnByWeek.forEach((rate, weekIndex) => {
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
            tooltip.html(`Cohort: ${cohort.cohortName}<br/>Week ${weekIndex + 1}<br/>Negative Churn Rate: ${rate.toFixed(1)}%`)
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
          .attr('fill', rate > 20 ? 'white' : 'black')
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
      .domain([0, 35])
      .range([0, 200]);

    const legendAxis = d3.axisRight(legendScale)
      .tickFormat(d => `${d}%`);

    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');

    gradient.selectAll('stop')
      .data(d3.range(0, 36, 5))
      .enter().append('stop')
      .attr('offset', d => `${(d / 35) * 100}%`)
      .attr('stop-color', d => colorScale(d));

    legend.append('rect')
      .attr('width', 20)
      .attr('height', 200)
      .style('fill', 'url(#legend-gradient)');

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
      .text('Negative Churn Rate (%)');
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
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          3 Months
        </button>
        <button
          onClick={() => setCohortRange('6months')}
          className={`px-3 py-1 text-xs rounded ${
            cohortRange === '6months' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          6 Months
        </button>
        <button
          onClick={() => setCohortRange('12months')}
          className={`px-3 py-1 text-xs rounded ${
            cohortRange === '12months' 
              ? 'bg-green-500 text-white' 
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

const generateMockNegativeChurnData = (filters: NegativeChurnFilters): NegativeChurnData[] => {
  const months = [];
  const today = new Date();
  
  // Generate months based on selected time period
  const monthsCount = filters.timePeriod === '1month' ? 1 : 
                     filters.timePeriod === '3months' ? 3 :
                     filters.timePeriod === '6months' ? 6 : 12;
  
  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const appointmentsLost = Math.floor(Math.random() * 150) + 50; // 50-200 appointments lost
    const appointmentsGained = Math.floor(Math.random() * 200) + 100; // 100-300 appointments gained
    const netChange = appointmentsGained - appointmentsLost;
    const negativeChurnRate = ((appointmentsGained - appointmentsLost) / (appointmentsLost + appointmentsGained)) * 100;
    
    months.push({
      month: monthName,
      appointmentsLost,
      appointmentsGained,
      netChange,
      negativeChurnRate
    });
  }
  
  return months;
};

const NegativeChurnDetailDashboard: React.FC<NegativeChurnDetailDashboardProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [negativeChurnData, setNegativeChurnData] = useState<NegativeChurnData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        const mockData = generateMockNegativeChurnData(filters);
        setNegativeChurnData(mockData);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!loading && negativeChurnData.length > 0 && svgRef.current) {
      drawChart();
    }
  }, [negativeChurnData, loading]);

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
      .domain(negativeChurnData.map(d => d.month))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(negativeChurnData, d => Math.max(d.appointmentsLost, d.appointmentsGained)) || 0])
      .range([height, 0]);

    // Right Y-axis scale for negative churn rate
    const yScaleRight = d3.scaleLinear()
      .domain(d3.extent(negativeChurnData, d => d.negativeChurnRate) as [number, number])
      .range([height, 0]);

    // Create bars for appointments lost
    g.selectAll('.bar-lost')
      .data(negativeChurnData)
      .enter().append('rect')
      .attr('class', 'bar-lost')
      .attr('x', d => xScale(d.month) || 0)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 2)
      .attr('height', 0)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.appointmentsLost))
      .attr('height', d => height - yScale(d.appointmentsLost));

    // Create bars for appointments gained
    g.selectAll('.bar-gained')
      .data(negativeChurnData)
      .enter().append('rect')
      .attr('class', 'bar-gained')
      .attr('x', d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr('y', height)
      .attr('width', xScale.bandwidth() / 2)
      .attr('height', 0)
      .attr('fill', '#22c55e')
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.appointmentsGained))
      .attr('height', d => height - yScale(d.appointmentsGained));

    // Create spline for negative churn rate
    const line = d3.line<NegativeChurnData>()
      .x(d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .y(d => yScaleRight(d.negativeChurnRate))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(negativeChurnData)
      .attr('class', 'trend-line')
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Animate the line
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .delay(800)
      .attr('stroke-dashoffset', 0);

    // Add circles for trend line points
    g.selectAll('.trend-point')
      .data(negativeChurnData)
      .enter().append('circle')
      .attr('class', 'trend-point')
      .attr('cx', d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScaleRight(d.negativeChurnRate))
      .attr('r', 0)
      .attr('fill', '#f59e0b')
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1300)
      .attr('r', 4);

    // Add text labels for appointments lost
    g.selectAll('.text-lost')
      .data(negativeChurnData)
      .enter().append('text')
      .attr('class', 'text-lost')
      .attr('x', d => (xScale(d.month) || 0) + xScale.bandwidth() / 4)
      .attr('y', d => yScale(d.appointmentsLost) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#ef4444')
      .text(d => d.appointmentsLost.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for appointments gained
    g.selectAll('.text-gained')
      .data(negativeChurnData)
      .enter().append('text')
      .attr('class', 'text-gained')
      .attr('x', d => (xScale(d.month) || 0) + (3 * xScale.bandwidth() / 4))
      .attr('y', d => yScale(d.appointmentsGained) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#22c55e')
      .text(d => d.appointmentsGained.toString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .attr('opacity', 1);

    // Add text labels for negative churn rate
    g.selectAll('.text-rate')
      .data(negativeChurnData)
      .enter().append('text')
      .attr('class', 'text-rate')
      .attr('x', d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScaleRight(d.negativeChurnRate) - 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#f59e0b')
      .text(d => `${d.negativeChurnRate.toFixed(1)}%`)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1800)
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
      .text('Appointments per Month');

    // Add right Y-axis
    g.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleRight))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text('Negative Churn Rate (%)');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(20, 20)`);

    const legendItems = [
      { name: 'Appointments Lost', color: '#ef4444' },
      { name: 'Appointments Gained', color: '#22c55e' },
      { name: 'Negative Churn Rate', color: '#f59e0b' }
    ];

    legendItems.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      if (item.color === '#f59e0b') {
        // Line for trend
        legendRow.append('line')
          .attr('x1', 0)
          .attr('x2', 15)
          .attr('y1', 8)
          .attr('y2', 8)
          .attr('stroke', item.color)
          .attr('stroke-width', 3);
      } else {
        // Rectangle for bars
        legendRow.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', item.color)
          .attr('opacity', 0.8);
      }

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .text(item.name);
    });

    // Add hover effects
    g.selectAll('.bar-lost, .bar-gained')
      .on('mouseover', function(event: any, d: unknown) {
        const data = d as NegativeChurnData;
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
          Period: ${data.month}<br/>
          Appointments Lost: ${data.appointmentsLost}<br/>
          Appointments Gained: ${data.appointmentsGained}<br/>
          Net Change: ${data.netChange > 0 ? '+' : ''}${data.netChange}<br/>
          Negative Churn Rate: ${data.negativeChurnRate.toFixed(2)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        d3.selectAll('.tooltip').remove();
      });
  };

  const updateFilters = (updates: Partial<NegativeChurnFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const getTotalStats = () => {
    const totalLost = negativeChurnData.reduce((sum, d) => sum + d.appointmentsLost, 0);
    const totalGained = negativeChurnData.reduce((sum, d) => sum + d.appointmentsGained, 0);
    const netChange = totalGained - totalLost;
    const avgNegativeChurnRate = negativeChurnData.reduce((sum, d) => sum + d.negativeChurnRate, 0) / negativeChurnData.length;

    return { totalLost, totalGained, netChange, avgNegativeChurnRate };
  };

  const timePeriodOptions = [
    { value: '1month', label: '1 Month' },
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' }
  ];

  if (!isOpen) return null;

  const stats = getTotalStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Negative Churn Analysis
              </CardTitle>
              <CardDescription>
                Track the balance between appointments lost through churn and gained through upselling
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Time Period Selection */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-gray-800">Time Period</h4>
              <div className="flex gap-2">
                {timePeriodOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.timePeriod === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilters({ timePeriod: option.value as any })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600">Total Lost</p>
                      <p className="text-2xl font-bold text-red-700">{stats.totalLost}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Total Gained</p>
                      <p className="text-2xl font-bold text-green-700">{stats.totalGained}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Net Change</p>
                      <p className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {stats.netChange >= 0 ? '+' : ''}{stats.netChange}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600">Avg Negative Churn</p>
                      <p className="text-2xl font-bold text-orange-700">{stats.avgNegativeChurnRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4 text-gray-800">Additional Filters</h4>
              
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

            {/* Chart Section */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <h4 className="font-semibold mb-4 text-gray-800">
                Negative Churn Trend - {filters.timePeriod === '1month' ? '1 Month' : filters.timePeriod === '3months' ? '3 Months' : filters.timePeriod === '6months' ? '6 Months' : '1 Year'}
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
                Negative Churn Cohort Analysis
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Track how different user cohorts exhibit negative churn behavior over time
              </p>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <NegativeChurnCohortChart filters={filters} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NegativeChurnDetailDashboard; 