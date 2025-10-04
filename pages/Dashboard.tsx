

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getTransactions, getTasks } from '../services/mockApi';
import { AnyTransaction, Task, TransactionType, TaskStatus, Income } from '../types';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import { formatCurrencyPHP } from '../utils/formatters';

const COLORS = ['#8A5CF6', '#A881FF', '#C6A9FF', '#E4D2FF', '#3D3D50', '#5A5A70', '#8884d8', '#82ca9d'];

const Dashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<AnyTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeFrame, setTimeFrame] = useState('all');
    
    const todayISO = new Date().toISOString().split('T')[0];
    const [customStartDate, setCustomStartDate] = useState<string>(todayISO);
    const [customEndDate, setCustomEndDate] = useState<string>(todayISO);

    // State for chart interactivity
    const [lineOpacity, setLineOpacity] = useState({ income: 1, expenses: 1, profit: 1 });
    const [inactivePieCategories, setInactivePieCategories] = useState<string[]>([]);
    const [inactiveIncomeSources, setInactiveIncomeSources] = useState<string[]>([]);


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [transData, taskData] = await Promise.all([getTransactions(), getTasks()]);
                setTransactions(transData);
                setTasks(taskData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const { filteredTransactions, previousPeriodTransactions } = useMemo(() => {
        const today = new Date();
        let start: Date;
        let end: Date = new Date();

        switch (timeFrame) {
            case 'daily':
                start = new Date(new Date().setHours(0, 0, 0, 0));
                break;
            case 'weekly':
                start = new Date(new Date().setDate(today.getDate() - 6));
                start.setHours(0, 0, 0, 0);
                break;
            case 'monthly':
                start = new Date(new Date().setDate(today.getDate() - 29)); // last 30 days
                start.setHours(0, 0, 0, 0);
                break;
            case 'ytd':
                start = new Date(today.getFullYear(), 0, 1);
                break;
            case 'custom':
                start = new Date(customStartDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
                break;
            case 'all':
            default:
                return { filteredTransactions: transactions, previousPeriodTransactions: [] };
        }

        const currentPeriodTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= end;
        });
        
        const duration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);

        const previousPeriodTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= prevStart && transactionDate <= prevEnd;
        });

        return { filteredTransactions: currentPeriodTransactions, previousPeriodTransactions };
    }, [transactions, timeFrame, customStartDate, customEndDate]);

    const kpiData = useMemo(() => {
        const calculateMetrics = (data: AnyTransaction[]) => {
            const totalIncome = data
                .filter(t => t.type === TransactionType.INCOME)
                .reduce((sum, t) => sum + t.amount, 0);

            const totalExpenses = data
                .filter(t => t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + t.amount, 0);

            const netProfit = totalIncome - totalExpenses;
            return { totalIncome, totalExpenses, netProfit };
        };

        const currentMetrics = calculateMetrics(filteredTransactions);
        const previousMetrics = calculateMetrics(previousPeriodTransactions);

        const tasksDueToday = tasks.filter(task => 
            task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString() && task.status !== TaskStatus.COMPLETED
        ).length;

        const getChange = (current: number, previous: number) => {
            if (previous === 0) {
                if (current > 0) return Infinity;
                if (current < 0) return -Infinity;
                return 0;
            }
            return ((current - previous) / Math.abs(previous)) * 100;
        };

        const netProfitChange = getChange(currentMetrics.netProfit, previousMetrics.netProfit);

        return { ...currentMetrics, tasksDueToday, netProfitChange };
    }, [filteredTransactions, previousPeriodTransactions, tasks]);

    const chartData = useMemo(() => {
        const dateMap = new Map<string, { income: number, expenses: number }>();

        filteredTransactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString();
            if (!dateMap.has(date)) {
                dateMap.set(date, { income: 0, expenses: 0 });
            }
            const entry = dateMap.get(date)!;
            if (t.type === TransactionType.INCOME) {
                entry.income += t.amount;
            } else {
                entry.expenses += t.amount;
            }
        });

        return Array.from(dateMap.entries())
            .map(([date, values]) => ({ 
                date, 
                income: values.income,
                expenses: values.expenses,
                profit: values.income - values.expenses,
             }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredTransactions]);
    
    const expenseCategoryData = useMemo(() => {
        const categoryMap = new Map<string, number>();
        filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
            });
        
        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);
    
    const incomeSourceData = useMemo(() => {
        const sourceMap = new Map<string, number>();
        filteredTransactions
            .filter((t): t is Income => t.type === TransactionType.INCOME)
            .forEach(t => {
                sourceMap.set(t.source, (sourceMap.get(t.source) || 0) + t.amount);
            });
        
        return Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);


    const handleLineLegendClick = (dataKey: string) => {
        setLineOpacity(prev => ({
            ...prev,
            // The type assertion ensures dataKey is a valid key of the lineOpacity state.
            [dataKey]: prev[dataKey as keyof typeof prev] === 1 ? 0.2 : 1,
        }));
    };
    
    const handlePieLegendClick = (data: any) => {
        const { value } = data; // `value` here is the category name from the legend payload
        setInactivePieCategories(prev =>
            prev.includes(value)
                ? prev.filter(cat => cat !== value)
                : [...prev, value]
        );
    };
    
    const handleIncomeLegendClick = (data: any) => {
        const { value } = data;
        setInactiveIncomeSources(prev =>
            prev.includes(value)
                ? prev.filter(src => src !== value)
                : [...prev, value]
        );
    };


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                 <div className="flex items-center gap-2 flex-wrap">
                    <select 
                        value={timeFrame} 
                        onChange={(e) => setTimeFrame(e.target.value)}
                        className="bg-[#1A1A23] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-gray-300 focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none"
                        aria-label="Select time frame"
                    >
                        <option value="all">All Time</option>
                        <option value="daily">Today</option>
                        <option value="weekly">Last 7 Days</option>
                        <option value="monthly">Last 30 Days</option>
                        <option value="ytd">Year to Date</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    {timeFrame === 'custom' && (
                        <>
                            <input 
                                type="date" 
                                value={customStartDate} 
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="bg-[#1A1A23] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-gray-300 focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none"
                                aria-label="Custom start date"
                            />
                            <span className="text-gray-400">to</span>
                            <input 
                                type="date" 
                                value={customEndDate} 
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="bg-[#1A1A23] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-gray-300 focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none"
                                aria-label="Custom end date"
                            />
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Income" value={kpiData.totalIncome} isLoading={isLoading} />
                <KpiCard title="Total Expenses" value={kpiData.totalExpenses} isLoading={isLoading} />
                <KpiCard title="Net Profit/Loss" value={kpiData.netProfit} isLoading={isLoading} change={kpiData.netProfitChange} />
                 <Card className="flex-1">
                    <p className="text-sm font-medium text-gray-400">Tasks Due Today</p>
                    <div className="mt-2">
                        {isLoading ? (
                            <div className="h-8 bg-gray-700 rounded-md animate-pulse w-1/4"></div>
                        ) : (
                            <p className="text-3xl font-bold text-white">{kpiData.tasksDueToday}</p>
                        )}
                    </div>
                </Card>
            </div>
            
            <Card>
                <h2 className="text-lg font-semibold text-white mb-4">Income vs Expenses</h2>
                 <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3A" />
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fontSize: 12 }} tickFormatter={(value) => `₱${Number(value)/1000}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#4ADE80" tick={{ fontSize: 12 }} tickFormatter={(value) => `₱${Number(value)/1000}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1A1A23', border: '1px solid #2D2D3A' }}
                            labelStyle={{ color: '#F9FAFB' }}
                            itemStyle={{ color: '#e5e7eb' }}
                            formatter={(value) => formatCurrencyPHP(Number(value))}
                        />
                        <Legend 
                            wrapperStyle={{fontSize: "14px", cursor: 'pointer'}}
                            onClick={(e) => handleLineLegendClick(e.dataKey as string)}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="income" stroke="#8A5CF6" strokeWidth={2} name="Income" strokeOpacity={lineOpacity.income} dot={{r: 2}} activeDot={{r: 6}}/>
                        <Line yAxisId="left" type="monotone" dataKey="expenses" stroke="#F87171" strokeWidth={2} name="Expenses" strokeOpacity={lineOpacity.expenses} dot={{r: 2}} activeDot={{r: 6}} />
                        <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#4ADE80" strokeWidth={2} name="Profit" strokeOpacity={lineOpacity.profit} dot={{r: 2}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-lg font-semibold text-white mb-4">Expense Categories</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={expenseCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                // Fix: Explicitly cast recharts properties to 'number' to resolve type errors in calculations.
                                // The library's type inference can be unreliable for these render prop arguments.
                                const RADIAN = Math.PI / 180;
                                const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                                const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
                                const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
                                return Number(percent) > 0.05 ? (<text x={x} y={y} fill="white" textAnchor={x > Number(cx) ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                    {`${(Number(percent) * 100).toFixed(0)}%`}
                                </text>) : null;
                            }}>
                                {expenseCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={inactivePieCategories.includes(entry.name) ? '#374151' : COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrencyPHP(Number(value))} contentStyle={{ backgroundColor: '#1A1A23', border: '1px solid #2D2D3A' }} itemStyle={{ color: '#e5e7eb' }} />
                             <Legend 
                                wrapperStyle={{fontSize: "12px", paddingTop: "10px", cursor: 'pointer'}}
                                onClick={handlePieLegendClick}
                                formatter={(value, entry) => {
                                    const color = inactivePieCategories.includes(value) ? '#6B7280' : '#E5E7EB';
                                    return <span style={{ color }}>{value}</span>;
                                }}
                             />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <h2 className="text-lg font-semibold text-white mb-4">Income Sources</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={incomeSourceData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={100} 
                                labelLine={false} 
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    // Fix: Explicitly cast recharts properties to 'number' to resolve type errors in calculations.
                                    // The library's type inference can be unreliable for these render prop arguments.
                                    const RADIAN = Math.PI / 180;
                                    const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                                    const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
                                    const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
                                    return Number(percent) > 0.05 ? (<text x={x} y={y} fill="white" textAnchor={x > Number(cx) ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                        {`${(Number(percent) * 100).toFixed(0)}%`}
                                    </text>) : null;
                                }}>
                                {incomeSourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={inactiveIncomeSources.includes(entry.name) ? '#374151' : COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrencyPHP(Number(value))} contentStyle={{ backgroundColor: '#1A1A23', border: '1px solid #2D2D3A' }} itemStyle={{ color: '#e5e7eb' }} />
                             <Legend 
                                wrapperStyle={{fontSize: "12px", paddingTop: "10px", cursor: 'pointer'}}
                                onClick={handleIncomeLegendClick}
                                formatter={(value, entry) => {
                                    const color = inactiveIncomeSources.includes(value) ? '#6B7280' : '#E5E7EB';
                                    return <span style={{ color }}>{value}</span>;
                                }}
                             />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;