import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

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

interface Customer {
  appointyId: string;
  userName: string;
  businessName: string;
  profession: string;
  country: string;
  membership: string;
  staffCount: number;
  monthlyAppointmentCount: number;
  validTill: string;
}

interface ChartDataPoint {
  category: string;
  appointments: number;
  accounts: number;
  bayesianNormal: number;
  customers: Customer[];
}

interface ActiveCustomersChartProps {
  filters: Filters;
}

type ViewMode = 'profession' | 'membership' | 'country';

const applyStaffFilter = (staffCount: number, filter: StaffFilter): boolean => {
  switch (filter.operator) {
    case 'gte':
      return staffCount >= filter.value1;
    case 'gt':
      return staffCount > filter.value1;
    case 'lte':
      return staffCount <= filter.value1;
    case 'lt':
      return staffCount < filter.value1;
    case 'eq':
      return staffCount === filter.value1;
    case 'between':
      return filter.value2 !== undefined 
        ? staffCount >= filter.value1 && staffCount <= filter.value2
        : staffCount >= filter.value1;
    default:
      return true;
  }
};

// Mock data generator with membership information
const generateMockData = (filters: Filters): Customer[] => {
  const customers: Customer[] = [];
  const professions = ['Healthcare', 'Beauty', 'Fitness', 'Education', 'Legal'];
  const countries = ['USA', 'Canada', 'UK', 'Australia', 'India'];
  const memberships = ['Basic', 'Pro', 'Premium', 'Enterprise'];
  
  for (let i = 1; i <= 150; i++) {
    const customer: Customer = {
      appointyId: `APT${i.toString().padStart(4, '0')}`,
      userName: `User ${i}`,
      businessName: `Business ${i}`,
      profession: professions[Math.floor(Math.random() * professions.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      membership: memberships[Math.floor(Math.random() * memberships.length)],
      staffCount: Math.floor(Math.random() * 20) + 1,
      monthlyAppointmentCount: Math.floor(Math.random() * 100) + 5,
      validTill: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    // Apply filters
    if (filters.professions.length > 0 && !filters.professions.includes(customer.profession)) continue;
    if (filters.countries.length > 0 && !filters.countries.includes(customer.country)) continue;
    if (filters.memberships.length > 0 && !filters.memberships.includes(customer.membership)) continue;
    if (!applyStaffFilter(customer.staffCount, filters.staffFilter)) continue;
    
    customers.push(customer);
  }
  
  return customers;
};

// Calculate Bayesian Normal (simplified implementation)
const calculateBayesianNormal = (appointments: number, accounts: number): number => {
  // Simple Bayesian calculation: (appointments + prior) / (accounts + prior_count)
  const prior = 20; // prior belief about average appointments
  const priorCount = 5; // confidence in prior
  return (appointments + prior) / (accounts + priorCount);
};

const ActiveCustomersChart: React.FC<ActiveCustomersChartProps> = ({ filters }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('profession');
  
  const itemsPerPage = 50;

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockData = generateMockData(filters);
      setCustomers(mockData);
      setCurrentPage(1);
      setLoading(false);
    }, 500);
  }, [filters]);

  // Process data for charts
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (customers.length === 0) return [];

    const grouped = d3.group(customers, d => {
      switch (viewMode) {
        case 'profession': return d.profession;
        case 'membership': return d.membership;
        case 'country': return d.country;
        default: return d.profession;
      }
    });

    return Array.from(grouped, ([category, customerList]) => {
      const appointments = customerList.reduce((sum, c) => sum + c.monthlyAppointmentCount, 0);
      const accounts = customerList.length;
      const bayesianNormal = calculateBayesianNormal(appointments, accounts);
      
      return {
        category,
        appointments,
        accounts,
        bayesianNormal,
        customers: customerList
      };
    }).sort((a, b) => b.accounts - a.accounts);
  }, [customers, viewMode]);

  useEffect(() => {
    if (chartData.length === 0 || !svgRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 60, right: 80, bottom: 160, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000);

    // Scales
    const xScale = d3.scaleBand()
      .domain(chartData.map(d => d.category))
      .range([0, width])
      .padding(0.3);

    // Left Y-axis for accounts (bars)
    const yScaleAccounts = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.accounts) || 0])
      .range([height, 0]);

    // Secondary scale for appointments (smaller bars)
    const yScaleAppointments = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.appointments) || 0])
      .range([height, height * 0.7]); // Only use bottom 30% of height

    // Right Y-axis for bayesian normal (line)
    const yScaleBayesian = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.bayesianNormal) || 0])
      .range([height, 0]);

    // Create grouped bars
    const barWidth = xScale.bandwidth() / 2;

    // Create bars for accounts
    const accountBars = g.selectAll(".account-bar")
      .data(chartData)
      .enter().append("rect")
      .attr("class", "account-bar")
      .attr("x", d => (xScale(d.category) || 0) + barWidth * 0.1)
      .attr("width", barWidth * 0.8)
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#3b82f6")
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("opacity", 1)
          .attr("stroke", "#1e40af")
          .attr("stroke-width", 2);

        tooltip.transition()
          .duration(150)
          .style("opacity", 1);
        
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 6px;">${d.category}</div>
          <div style="color: #60a5fa;">Active Accounts: ${d.accounts.toLocaleString()}</div>
          <div style="color: #34d399;">Total Appointments: ${d.appointments.toLocaleString()}</div>
          <div style="color: #f87171;">Bayesian Score: ${d.bayesianNormal.toFixed(2)}</div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("opacity", 0.8)
          .attr("stroke", "none");

        tooltip.transition()
          .duration(150)
          .style("opacity", 0);
      });

    // Create bars for appointments
    const appointmentBars = g.selectAll(".appointment-bar")
      .data(chartData)
      .enter().append("rect")
      .attr("class", "appointment-bar")
      .attr("x", d => (xScale(d.category) || 0) + barWidth * 1.1)
      .attr("width", barWidth * 0.8)
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#10b981")
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("opacity", 1)
          .attr("stroke", "#047857")
          .attr("stroke-width", 2);

        tooltip.transition()
          .duration(150)
          .style("opacity", 1);
        
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 6px;">${d.category}</div>
          <div style="color: #60a5fa;">Active Accounts: ${d.accounts.toLocaleString()}</div>
          <div style="color: #34d399;">Total Appointments: ${d.appointments.toLocaleString()}</div>
          <div style="color: #f87171;">Bayesian Score: ${d.bayesianNormal.toFixed(2)}</div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("opacity", 0.8)
          .attr("stroke", "none");

        tooltip.transition()
          .duration(150)
          .style("opacity", 0);
      });

    // Animate account bars
    accountBars.transition()
      .duration(1000)
      .attr("y", d => yScaleAccounts(d.accounts))
      .attr("height", d => height - yScaleAccounts(d.accounts));

    // Animate appointment bars
    appointmentBars.transition()
      .duration(1000)
      .delay(200)
      .attr("y", d => yScaleAppointments(d.appointments))
      .attr("height", d => height - yScaleAppointments(d.appointments));

    // Add account value labels
    g.selectAll(".account-label")
      .data(chartData)
      .enter().append("text")
      .attr("class", "account-label")
      .attr("x", d => (xScale(d.category) || 0) + barWidth * 0.5)
      .attr("y", d => yScaleAccounts(d.accounts) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#1e40af")
      .text(d => d.accounts);

    // Add appointment value labels
    g.selectAll(".appointment-label")
      .data(chartData)
      .enter().append("text")
      .attr("class", "appointment-label")
      .attr("x", d => (xScale(d.category) || 0) + barWidth * 1.5)
      .attr("y", d => yScaleAppointments(d.appointments) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#047857")
      .text(d => d.appointments.toLocaleString());

    // Create line for bayesian normal
    const line = d3.line<ChartDataPoint>()
      .x(d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .y(d => yScaleBayesian(d.bayesianNormal))
      .curve(d3.curveMonotoneX);

    const path = g.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 4)
      .attr("d", line)
      .style("cursor", "pointer")
      .on("mouseover", function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("stroke-width", 6);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("stroke-width", 4);
      });

    // Animate line
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .delay(500)
      .attr("stroke-dashoffset", 0);

    // Add circles for bayesian normal data points
    const circles = g.selectAll(".bayesian-point")
      .data(chartData)
      .enter().append("circle")
      .attr("class", "bayesian-point")
      .attr("cx", d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr("cy", d => yScaleBayesian(d.bayesianNormal))
      .attr("r", 6)
      .attr("fill", "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 8)
          .attr("stroke-width", 3);

        // Highlight the corresponding line segment
        path.transition()
          .duration(150)
          .attr("stroke-width", 6);

        tooltip.transition()
          .duration(150)
          .style("opacity", 1);
        
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 6px;">${d.category}</div>
          <div style="color: #60a5fa;">Active Accounts: ${d.accounts.toLocaleString()}</div>
          <div style="color: #34d399;">Total Appointments: ${d.appointments.toLocaleString()}</div>
          <div style="color: #f87171;">Bayesian Score: ${d.bayesianNormal.toFixed(2)}</div>
          <div style="margin-top: 6px; font-size: 10px; color: #d1d5db;">
            Click to see detailed breakdown
          </div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 60) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 60) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 6)
          .attr("stroke-width", 2);

        path.transition()
          .duration(150)
          .attr("stroke-width", 4);

        tooltip.transition()
          .duration(150)
          .style("opacity", 0);
      })
      .on("click", function(event, d) {
        // Pulse animation on click
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 10)
          .transition()
          .duration(200)
          .attr("r", 6);

        console.log("Detailed data for:", d.category, d);
      });

    circles.transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1);

    // Add bayesian value labels
    g.selectAll(".bayesian-label")
      .data(chartData)
      .enter().append("text")
      .attr("class", "bayesian-label")
      .attr("x", d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr("y", d => yScaleBayesian(d.bayesianNormal) - 12)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#dc2626")
      .style("opacity", 0)
      .text(d => d.bayesianNormal.toFixed(1))
      .transition()
      .delay(1500)
      .duration(500)
      .style("opacity", 1);

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Add left Y axis (accounts)
    g.append("g")
      .call(d3.axisLeft(yScaleAccounts))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#1e40af");

    // Add right Y axis (bayesian normal)
    g.append("g")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleBayesian))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#dc2626");

    // Add axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#1e40af")
      .text("Accounts & Appointments");

    g.append("text")
      .attr("transform", "rotate(90)")
      .attr("y", 0 - width - margin.right + 20)
      .attr("x", height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#dc2626")
      .text("Bayesian Normal");

    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 60})`)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(getViewModeLabel(viewMode));

    // Enhanced Legend - positioned at bottom with better spacing
    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${height + margin.top + 80})`);

    // Legend background
    legend.append("rect")
      .attr("x", -10)
      .attr("y", -10)
      .attr("width", width + 20)
      .attr("height", 60)
      .attr("fill", "#f8fafc")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1)
      .attr("rx", 6);

    // Legend title
    legend.append("text")
      .attr("x", 10)
      .attr("y", 8)
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .style("fill", "#334155")
      .text("Chart Metrics:");

    // First row - Accounts
    legend.append("rect")
      .attr("x", 10)
      .attr("y", 18)
      .attr("width", 20)
      .attr("height", 12)
      .attr("fill", "#3b82f6")
      .attr("opacity", 0.8);

    legend.append("text")
      .attr("x", 38)
      .attr("y", 28)
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#1e40af")
      .text("Active Accounts (Blue Bars)");

    // Second row - Appointments
    legend.append("rect")
      .attr("x", 200)
      .attr("y", 18)
      .attr("width", 20)
      .attr("height", 12)
      .attr("fill", "#10b981")
      .attr("opacity", 0.8);

    legend.append("text")
      .attr("x", 228)
      .attr("y", 28)
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#047857")
      .text("Total Appointments (Green Bars)");

    // Third row - Bayesian normal
    legend.append("line")
      .attr("x1", 420)
      .attr("x2", 440)
      .attr("y1", 24)
      .attr("y2", 24)
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3);

    legend.append("circle")
      .attr("cx", 430)
      .attr("cy", 24)
      .attr("r", 4)
      .attr("fill", "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    legend.append("text")
      .attr("x", 448)
      .attr("y", 28)
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#dc2626")
      .text("Bayesian Normal Score (Red Line)");

    // Add scale information
    legend.append("text")
      .attr("x", 10)
      .attr("y", 45)
      .style("font-size", "10px")
      .style("fill", "#6b7280")
      .text("Left Axis: Accounts & Appointments | Right Axis: Bayesian Normal Score");

    // Cleanup function
    return () => {
      d3.select("body").selectAll(".chart-tooltip").remove();
    };

  }, [chartData, viewMode]);

  const getViewModeLabel = (mode: ViewMode): string => {
    switch (mode) {
      case 'profession': return 'Profession';
      case 'membership': return 'Membership Type';
      case 'country': return 'Country';
      default: return mode;
    }
  };

  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = customers.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Chart View Options</CardTitle>
          <CardDescription>
            Select how to group and view your customer data. The chart shows both account numbers (blue bars) and bayesian normal values (red line).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <span className="text-sm font-medium">View by:</span>
            {(['profession', 'membership', 'country'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode(mode)}
              >
                {getViewModeLabel(mode)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Active Customers by {getViewModeLabel(viewMode)}
          </CardTitle>
          <CardDescription>
            Dual-axis visualization: Blue bars show number of accounts (left axis), Red line shows bayesian normal values (right axis)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading chart...</div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg ref={svgRef}></svg>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Appointments</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {chartData.reduce((sum, d) => sum + d.appointments, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Accounts</CardDescription>
            <CardTitle className="text-2xl text-blue-700">
              {chartData.reduce((sum, d) => sum + d.accounts, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Bayesian Normal</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {chartData.length > 0 
                ? (chartData.reduce((sum, d) => sum + d.bayesianNormal, 0) / chartData.length).toFixed(2)
                : '0'
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
          <CardDescription>
            Complete customer data for the current view
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div>Loading customer data...</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Business Name</th>
                      <th className="text-left p-2">Profession</th>
                      <th className="text-left p-2">Country</th>
                      <th className="text-left p-2">Membership</th>
                      <th className="text-left p-2">Staff Count</th>
                      <th className="text-left p-2">Monthly Appointments</th>
                      <th className="text-left p-2">Valid Till</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCustomers.map((customer) => (
                      <tr key={customer.appointyId} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-sm">{customer.appointyId}</td>
                        <td className="p-2 text-sm">{customer.businessName}</td>
                        <td className="p-2 text-sm">{customer.profession}</td>
                        <td className="p-2 text-sm">{customer.country}</td>
                        <td className="p-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            customer.membership === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                            customer.membership === 'Premium' ? 'bg-blue-100 text-blue-800' :
                            customer.membership === 'Pro' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.membership}
                          </span>
                        </td>
                        <td className="p-2 text-sm">{customer.staffCount}</td>
                        <td className="p-2 text-sm">{customer.monthlyAppointmentCount}</td>
                        <td className="p-2 text-sm">{customer.validTill}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, customers.length)} of {customers.length} customers
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveCustomersChart; 