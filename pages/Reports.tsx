


import React, {
    useState,
    useEffect,
    useMemo
} from 'react';
import {
    getTransactions
} from '../services/mockApi';
import {
    AnyTransaction,
    TransactionType,
    Expense,
    Income
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
    formatCurrencyPHP,
    downloadCSV
} from '../utils/formatters';
import {
    DocumentArrowDownIcon
} from '../components/Icons';
import {
    PieChart,
    Pie,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

const COLORS = ['#8A5CF6', '#A881FF', '#C6A9FF', '#E4D2FF', '#3D3D50', '#5A5A70', '#8884d8', '#82ca9d'];

const StatCard: React.FC < {
    title: string;
    value: number;
    change: number;
    isLoading: boolean;
} > = ({
    title,
    value,
    change,
    isLoading
}) => {
    const isPositive = change >= 0;
    const changeText = isFinite(change) ? `${isPositive ? '+' : ''}${change.toFixed(1)}%` : 'N/A';

    return (
        <Card>
            <p className = "text-sm font-medium text-gray-400" >{title}</p>
            <div className = "mt-2" >
                {isLoading ? (
                    <div className = "h-8 bg-gray-700 rounded-md animate-pulse w-3/4" ></div>
                ) : (
                    <p className = "text-3xl font-bold text-white" >{formatCurrencyPHP(value)}</p>
                )}
            </div>
            <div className = "mt-2 flex items-center text-sm" >
                {!isLoading && (
                    <span className = {`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`} > {changeText}</span>
                )}
                <span className = "text-gray-500 ml-1" > vs.previous period </span>
            </div>
        </Card>
    );
};


const Reports: React.FC = () => {
    const [transactions, setTransactions] = useState <AnyTransaction[]> ([]);
    const [isLoading, setIsLoading] = useState(true);
    const today = useMemo(() => new Date(), []);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState <string> (firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState <string> (today.toISOString().split('T')[0]);
    const [activeTimeframe, setActiveTimeframe] = useState('month');


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const transData = await getTransactions();
            setTransactions(transData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const {
        currentPeriod,
        previousPeriod
    } = useMemo(() => {
        if (!startDate || !endDate) {
            return {
                currentPeriod: [],
                previousPeriod: []
            };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const diff = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - diff);

        const current = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= end;
        });

        const previous = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= prevStart && transactionDate <= prevEnd;
        });

        return {
            currentPeriod: current,
            previousPeriod: previous
        };
    }, [transactions, startDate, endDate]);


    const summaryData = useMemo(() => {
        const calcMetrics = (data: AnyTransaction[]) => {
            const income = data.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
            const expenses = data.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
            const profit = income - expenses;
            return {
                income,
                expenses,
                profit
            };
        };

        const current = calcMetrics(currentPeriod);
        const previous = calcMetrics(previousPeriod);

        const getChange = (currentVal: number, previousVal: number) => {
            if (previousVal === 0 && currentVal === 0) return 0;
            if (previousVal === 0) return 100;
            return ((currentVal - previousVal) / Math.abs(previousVal)) * 100;
        };

        return {
            income: current.income,
            expenses: current.expenses,
            profit: current.profit,
            incomeChange: getChange(current.income, previous.income),
            expensesChange: getChange(current.expenses, previous.expenses),
            profitChange: getChange(current.profit, previous.profit),
        };
    }, [currentPeriod, previousPeriod]);

    const pnlData = useMemo(() => {
        const incomeByCategory = currentPeriod
            .filter((t): t is Income => t.type === TransactionType.INCOME)
            .reduce((acc, t) => {
                acc[t.source] = (acc[t.source] || 0) + t.amount;
                return acc;
            }, {} as Record <string, number> );

        const expenseByCategory = currentPeriod
            .filter((t): t is Expense => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record <string, number> );

        // Fix: Explicitly type `sum` and `amount` to ensure they are treated as numbers.
        const totalIncome = Object.values(incomeByCategory).reduce((sum: number, amount: number) => sum + amount, 0);
        // Fix: Explicitly type `sum` and `amount` to ensure they are treated as numbers.
        const totalExpenses = Object.values(expenseByCategory).reduce((sum: number, amount: number) => sum + amount, 0);

        return {
            // Fix: Cast sorting values to numbers to prevent arithmetic operations on 'unknown' types.
            incomeItems: Object.entries(incomeByCategory).sort(([, a], [, b]) => Number(b) - Number(a)),
            // Fix: Cast sorting values to numbers to prevent arithmetic operations on 'unknown' types.
            expenseItems: Object.entries(expenseByCategory).sort(([, a], [, b]) => Number(b) - Number(a)),
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
        };
    }, [currentPeriod]);

    const handleSetTimeframe = (name: string) => {
        setActiveTimeframe(name);
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (name) {
            case '30d':
                start.setDate(today.getDate() - 30);
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'year':
                start = new Date(today.getFullYear(), 0, 1);
                break;
            case 'all':
                if (transactions.length > 0) {
                    start = transactions.reduce((earliest, t) => {
                        const d = new Date(t.date);
                        return d < earliest ? d : earliest;
                    }, new Date());
                }
                break;
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };
    
    const handleDateChange = () => {
        setActiveTimeframe('custom');
    };

    const handleExportPnlCsv = () => {
        const headers = ['Category', 'Amount'];
        const data: (string | number)[][] = [];

        data.push(['INCOME', '']);
        pnlData.incomeItems.forEach(([name, value]) => data.push([`  ${name}`, value]));
        data.push(['Total Income', pnlData.totalIncome]);
        data.push(['', '']);
        data.push(['EXPENSES', '']);
        pnlData.expenseItems.forEach(([name, value]) => data.push([`  ${name}`, value]));
        data.push(['Total Expenses', pnlData.totalExpenses]);
        data.push(['', '']);
        data.push(['NET PROFIT', pnlData.netProfit]);

        downloadCSV(headers, data, `profit-and-loss_${startDate}_to_${endDate}.csv`);
    };
    
    const timeframeButtons = [
        { id: '30d', label: 'Last 30 Days' },
        { id: 'month', label: 'This Month' },
        { id: 'last_month', label: 'Last Month' },
        { id: 'year', label: 'This Year' },
        { id: 'all', label: 'All Time' },
    ];
    
    const filterInputClasses = "bg-[#1A1A23] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm text-gray-300 focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <div className = "space-y-8" >
            <div>
                <h1 className = "text-3xl font-bold text-white" > Financial Reports </h1>
                <p className = "text-gray-400 mt-1" > Analyze your financial performance with detailed reports. </p>
            </div>

            <Card>
                <div className = "flex flex-col md:flex-row justify-between items-center gap-4" >
                    <div className = "flex items-center gap-2 flex-wrap" >
                        {timeframeButtons.map(btn => (
                            <Button key = {btn.id}
                                variant = {activeTimeframe === btn.id ? 'primary' : 'secondary'}
                                onClick = {() => handleSetTimeframe(btn.id)} >
                                {btn.label}
                            </Button>
                        ))}
                    </div>
                    <div className = "flex items-center gap-2 flex-wrap" >
                        <input type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); handleDateChange(); }}
                            className = {filterInputClasses}
                            aria-label="Start date" />
                        <span className = "text-gray-400" > to </span>
                        <input type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); handleDateChange(); }}
                            className = {filterInputClasses}
                            aria-label="End date" />
                    </div>
                </div>
            </Card>

            <div className = "grid grid-cols-1 lg:grid-cols-3 gap-6" >
                <StatCard title = "Total Income"
                    value = {summaryData.income}
                    change = {summaryData.incomeChange}
                    isLoading = {isLoading}
                />
                <StatCard title = "Total Expenses"
                    value = {summaryData.expenses}
                    change = {summaryData.expensesChange}
                    isLoading = {isLoading}
                />
                <StatCard title = "Net Profit"
                    value = {summaryData.profit}
                    change = {summaryData.profitChange}
                    isLoading = {isLoading}
                />
            </div>

            <Card>
                <div className = "flex justify-between items-center mb-4" >
                    <h2 className = "text-lg font-semibold text-white" > Profit & Loss Statement </h2>
                    <div className = "flex space-x-2" >
                        <Button variant = "secondary"
                            leftIcon = {<DocumentArrowDownIcon />}
                            onClick = {handleExportPnlCsv} >
                            Export CSV
                        </Button>
                    </div>
                </div>
                <div className = "overflow-x-auto" >
                    <table className = "w-full text-sm" >
                        <tbody>
                            <tr>
                                <th scope="row"
                                    className = "px-4 py-3 text-left font-bold text-gray-300 uppercase tracking-wider"
                                    colSpan = {2} >
                                    Income
                                </th>
                            </tr>
                            {pnlData.incomeItems.map(([name, value]) => (
                                <tr key = {`inc-${name}`}
                                    className = "border-b border-transparent hover:bg-[#0D0D12]" >
                                    <td className = "px-6 py-2 text-gray-400" >{name}</td>
                                    <td className = "px-4 py-2 text-right text-gray-300" >{formatCurrencyPHP(value)}</td>
                                </tr>
                            ))}
                            <tr className = "border-t-2 border-[#2D2D3A]" >
                                <th scope="row" className = "px-4 py-3 text-left font-semibold text-white" > Total Income </th>
                                <td className = "px-4 py-3 text-right font-semibold text-white" >{formatCurrencyPHP(pnlData.totalIncome)}</td>
                            </tr>
                            <tr>
                                <td colSpan = {2} className = "py-2" > </td>
                            </tr>
                            <tr>
                                <th scope="row" className = "px-4 py-3 text-left font-bold text-gray-300 uppercase tracking-wider" colSpan = {2} >
                                    Expenses
                                </th>
                            </tr>
                            {pnlData.expenseItems.map(([name, value]) => (
                                <tr key = {`exp-${name}`}
                                    className = "border-b border-transparent hover:bg-[#0D0D12]" >
                                    <td className = "px-6 py-2 text-gray-400" >{name}</td>
                                    <td className = "px-4 py-2 text-right text-gray-300" > ({formatCurrencyPHP(value)}) </td>
                                </tr>
                            ))}
                            <tr className = "border-t-2 border-[#2D2D3A]" >
                                <th scope="row" className = "px-4 py-3 text-left font-semibold text-white" > Total Expenses </th>
                                <td className = "px-4 py-3 text-right font-semibold text-white" > ({formatCurrencyPHP(pnlData.totalExpenses)}) </td>
                            </tr>
                            <tr>
                                <td colSpan = {2} className = "py-2" > </td>
                            </tr>
                            <tr className = "bg-[#0D0D12] border-t-2 border-double border-[#2D2D3A]" >
                                <th scope="row" className = "px-4 py-4 text-left font-bold text-lg text-white" > Net Profit </th>
                                <td className = {`px-4 py-4 text-right font-bold text-lg ${pnlData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} >
                                    {formatCurrencyPHP(pnlData.netProfit)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className = "grid grid-cols-1 lg:grid-cols-2 gap-6" >
                <Card>
                    <h2 className = "text-lg font-semibold text-white mb-4" > Expense Breakdown </h2>
                    <ResponsiveContainer width = "100%" height = {300} >
                        <PieChart>
                            <Pie data = {pnlData.expenseItems.map(([name, value]) => ({name, value}))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius = {100}
                                labelLine = {false}
                                label = {({cx, cy, midAngle, innerRadius, outerRadius, percent}) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                                        const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
                                        const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
                                        return Number(percent) > 0.05 ? (
                                            <text x = {x} y = {y} fill="white" textAnchor = {x > Number(cx) ? 'start' : 'end'} dominantBaseline="central" fontSize = {12} >
                                                {`${(Number(percent) * 100).toFixed(0)}%`}
                                            </text>
                                        ) : null;
                                    }}
                                >
                                {pnlData.expenseItems.map((entry, index) => <Cell key = {`cell-${index}`} fill = {COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter = {(value) => formatCurrencyPHP(Number(value))}
                                contentStyle = {{backgroundColor: '#1A1A23', border: '1px solid #2D2D3A'}}
                                itemStyle = {{color: '#e5e7eb'}}
                            />
                            <Legend wrapperStyle = {{fontSize: "12px", paddingTop: "10px"}} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <h2 className = "text-lg font-semibold text-white mb-4" > Income By Source </h2>
                    <ResponsiveContainer width = "100%" height = {300} >
                        <PieChart>
                            <Pie data = {pnlData.incomeItems.map(([name, value]) => ({name, value}))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius = {100}
                                labelLine = {false}
                                label = {({cx, cy, midAngle, innerRadius, outerRadius, percent}) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                                    const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
                                    const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
                                    return Number(percent) > 0.05 ? (
                                        <text x={x} y={y} fill="white" textAnchor={x > Number(cx) ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                            {`${(Number(percent) * 100).toFixed(0)}%`}
                                        </text>
                                    ) : null;
                                }}>
                                {pnlData.incomeItems.map((entry, index) => <Cell key = {`cell-${index}`} fill = {COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter = {(value) => formatCurrencyPHP(Number(value))}
                                contentStyle = {{backgroundColor: '#1A1A23', border: '1px solid #2D2D3A'}}
                                itemStyle = {{color: '#e5e7eb'}}
                            />
                            <Legend wrapperStyle = {{fontSize: "12px", paddingTop: "10px"}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
