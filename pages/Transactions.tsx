
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getTransactions } from '../services/mockApi';
import { AnyTransaction, TransactionType, Income, Expense } from '../types';
import { formatCurrencyPHP, formatDate, downloadCSV } from '../utils/formatters';
import { DocumentArrowDownIcon } from '../components/Icons';

type FilterType = 'all' | TransactionType.INCOME | TransactionType.EXPENSE;

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<AnyTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    
    // Advanced filter state
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedMethod, setSelectedMethod] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getTransactions();
            setTransactions(data);
            setIsLoading(false);
        };
        fetchData();
    }, []);
    
    const { categories, methods } = useMemo(() => {
        const categoriesSet = new Set<string>();
        const methodsSet = new Set<string>();
        transactions.forEach(t => {
            categoriesSet.add(t.category);
            methodsSet.add(t.method);
        });
        return {
            categories: ['all', ...Array.from(categoriesSet).sort()],
            methods: ['all', ...Array.from(methodsSet).sort()],
        };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => activeFilter === 'all' || t.type === activeFilter)
            .filter(t => {
                if (dateRange.start && new Date(t.date) < new Date(dateRange.start)) return false;
                if (dateRange.end) {
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(23, 59, 59, 999); // Include the whole end day
                    if (new Date(t.date) > endDate) return false;
                }
                return true;
            })
            .filter(t => selectedCategory === 'all' || t.category === selectedCategory)
            .filter(t => selectedMethod === 'all' || t.method === selectedMethod)
            .filter(t =>
                Object.values(t).some(val =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
    }, [transactions, searchTerm, activeFilter, dateRange, selectedCategory, selectedMethod]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setActiveFilter('all');
        setDateRange({ start: '', end: '' });
        setSelectedCategory('all');
        setSelectedMethod('all');
    };

    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) return;
        const headers = ['Date', 'Type', 'Source / Vendor', 'Invoice No.', 'Category', 'Account', 'Amount'];
        const data = filteredTransactions.map(t => {
            const expense = t as Expense;
            const income = t as Income;
            return [
                formatDate(t.date),
                t.type,
                t.type === TransactionType.INCOME ? income.source : expense.vendor,
                t.type === TransactionType.EXPENSE ? expense.invoiceNo || '' : '',
                t.category,
                t.method,
                (t.type === TransactionType.INCOME ? t.amount : -t.amount),
            ];
        });
        downloadCSV(headers, data, 'transactions-export.csv');
    };

    const handleDownloadTemplate = () => {
        const headers = ['date', 'type', 'category', 'method', 'amount', 'currency', 'source_or_vendor', 'notes'];
        downloadCSV(headers, [], 'transaction-upload-template.csv');
    };
    
    const filterInputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-1.5 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Transactions</h1>
            <Card>
                 <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Filter Transactions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Date Range</label>
                            <div className="flex gap-2">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className={filterInputClasses} placeholder="Start" />
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className={filterInputClasses} placeholder="End" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Category</label>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={filterInputClasses}>
                                {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Account/Method</label>
                            <select value={selectedMethod} onChange={e => setSelectedMethod(e.target.value)} className={filterInputClasses}>
                                {methods.map(m => <option key={m} value={m}>{m === 'all' ? 'All Accounts' : m}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={filterInputClasses}
                            />
                        </div>
                    </div>
                </div>
                
                 <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex space-x-2">
                        {(['all', 'income', 'expense'] as FilterType[]).map(filter => (
                            <Button
                                key={filter}
                                variant={activeFilter === filter ? 'primary' : 'secondary'}
                                onClick={() => setActiveFilter(filter)}
                                className="capitalize"
                            >
                                {filter}
                            </Button>
                        ))}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="subtle" onClick={resetFilters}>Reset Filters</Button>
                        <Button variant="secondary" onClick={handleExportCSV} leftIcon={<DocumentArrowDownIcon/>}>Export CSV</Button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-[#0D0D12]">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Source / Vendor</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Account</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="border-b border-[#2D2D3A] hover:bg-[#0D0D12] cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(t.date)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">
                                            {t.type === TransactionType.INCOME ? (t as Income).source : (t as Expense).vendor}
                                        </div>
                                        {t.type === TransactionType.EXPENSE && (t as Expense).invoiceNo && (
                                            <div className="text-xs text-gray-500">
                                                Inv: {(t as Expense).invoiceNo}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{t.category}</td>
                                    <td className="px-6 py-4">{t.method}</td>
                                    <td className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                                        {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrencyPHP(t.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 {isLoading && <div className="text-center p-4">Loading...</div>}
                 {!isLoading && filteredTransactions.length === 0 && <div className="text-center p-4">No transactions found for this filter.</div>}
            </Card>
        </div>
    );
};

export default Transactions;
