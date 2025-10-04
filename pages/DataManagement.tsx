

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getTransactions, addTransactions } from '../services/mockApi';
import { AnyTransaction, TransactionType, Income, Expense } from '../types';
import { formatCurrencyPHP, formatDate, downloadCSV } from '../utils/formatters';
import { DocumentArrowDownIcon } from '../components/Icons';

const DataManagement: React.FC = () => {
    const [transactions, setTransactions] = useState<AnyTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Advanced filter state
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
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
            .filter(t => {
                if (dateRange.start && new Date(t.date) < new Date(dateRange.start)) return false;
                if (dateRange.end) {
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(23, 59, 59, 999);
                    if (new Date(t.date) > endDate) return false;
                }
                return true;
            })
            .filter(t => selectedType === 'all' || t.type === selectedType)
            .filter(t => selectedCategory === 'all' || t.category === selectedCategory)
            .filter(t => selectedMethod === 'all' || t.method === selectedMethod)
            .filter(t =>
                Object.values(t).some(val =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
    }, [transactions, searchTerm, dateRange, selectedType, selectedCategory, selectedMethod]);

    const stats = useMemo(() => {
        const categories = new Set(transactions.map(t => t.category));
        const accounts = new Set(transactions.map(t => t.method));
        return {
            totalRecords: transactions.length,
            categories: categories.size,
            accounts: accounts.size,
        };
    }, [transactions]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setDateRange({ start: '', end: '' });
        setSelectedType('all');
        setSelectedCategory('all');
        setSelectedMethod('all');
    };

    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) return;
        const headers = ['Date', 'Type', 'Category', 'Account', 'Amount', 'Notes'];
        const data = filteredTransactions.map(t => [
            formatDate(t.date),
            t.type,
            t.category,
            t.method,
            t.amount,
            t.notes || '',
        ]);
        downloadCSV(headers, data, 'data-management-export.csv');
    };

    const handleDownloadTemplate = () => {
        const headers = ['date', 'type', 'category', 'method', 'amount', 'currency', 'source_or_vendor', 'notes'];
        downloadCSV(headers, [], 'transaction-upload-template.csv');
    };

    const handleFileUpload = (file: File) => {
        if (!file || !file.type.includes('csv')) {
            alert('Please upload a valid CSV file.');
            return;
        }
    
        const reader = new FileReader();
    
        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') return;
    
            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                const headerLine = lines.shift()?.trim();
                if (!headerLine) throw new Error("CSV is empty or has no header.");
    
                const headers = headerLine.split(',').map(h => h.trim());
                const expectedHeaders = ['date', 'type', 'category', 'method', 'amount', 'currency', 'source_or_vendor', 'notes'];
                
                if (headers.length !== expectedHeaders.length || !headers.every((h, i) => h === expectedHeaders[i])) {
                     throw new Error(`Invalid CSV headers. Expected: ${expectedHeaders.join(', ')}`);
                }
    
                const newTransactions: Omit<AnyTransaction, 'id'>[] = lines.map((line, index) => {
                    const values = line.split(',');
                    const row: { [key: string]: string } = headers.reduce((obj, nextKey, index) => {
                        obj[nextKey] = values[index]?.trim();
                        return obj;
                    }, {});
    
                    if (!row.date || !row.type || !row.amount) throw new Error(`Missing required data on row ${index + 2}.`);
                    
                    const amount = parseFloat(row.amount);
                    if (isNaN(amount)) throw new Error(`Invalid amount on row ${index + 2}.`);
                    
                    const type = row.type.toLowerCase() as TransactionType;
                    if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
                        throw new Error(`Invalid transaction type on row ${index + 2}. Must be 'income' or 'expense'.`);
                    }
    
                    const commonData = {
                        date: new Date(row.date).toISOString(),
                        amount: amount,
                        currency: 'PHP' as const,
                        category: row.category,
                        method: row.method as any,
                        notes: row.notes,
                        createdBy: 'csv-upload',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
    
                    if (type === TransactionType.INCOME) {
                        return { ...commonData, type: TransactionType.INCOME, source: row.source_or_vendor } as Omit<Income, 'id'>;
                    } else {
                        return { ...commonData, type: TransactionType.EXPENSE, vendor: row.source_or_vendor } as Omit<Expense, 'id'>;
                    }
                });
    
                const added = await addTransactions(newTransactions);
                setTransactions(prev => [...added, ...prev]);
                alert(`${newTransactions.length} transactions uploaded successfully!`);
    
            } catch (error) {
                console.error("CSV parsing error:", error);
                alert(`Error uploading file: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
            }
        };
    
        reader.readAsText(file);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const filterInputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-1.5 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Data Management</h1>
                <Button variant="secondary" onClick={handleExportCSV} leftIcon={<DocumentArrowDownIcon/>}>Export CSV</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg"><svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10m16-10v10M4 17h16M4 7h16" /></svg></div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Records</p>
                        <p className="text-2xl font-bold text-white">{stats.totalRecords}</p>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg"><svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h2zm0 0V3m0 2v.01" /></svg></div>
                    <div>
                        <p className="text-gray-400 text-sm">Categories</p>
                        <p className="text-2xl font-bold text-white">{stats.categories}</p>
                    </div>
                </Card>
                 <Card className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg"><svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
                    <div>
                        <p className="text-gray-400 text-sm">Accounts</p>
                        <p className="text-2xl font-bold text-white">{stats.accounts}</p>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">Upload CSV Data</h2>
                    <Button variant="subtle" onClick={handleDownloadTemplate} leftIcon={<DocumentArrowDownIcon />}>Download Template</Button>
                </div>
                <div 
                    className={`border-2 border-dashed border-[#2D2D3A] rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ${isDragOver ? 'border-[#8A5CF6] bg-[#8A5CF6]/10' : 'hover:border-gray-500'}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <p className="mt-2 text-sm text-gray-400">{isDragOver ? "Drop file to upload" : "Click to upload or drag and drop"}</p>
                    <p className="text-xs text-gray-500">CSV files only</p>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="sr-only" 
                        accept=".csv,text/csv" 
                        onChange={handleFileSelect}
                    />
                </div>
            </Card>

            <Card>
                 <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Filter Records</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Date Range</label>
                            <div className="flex gap-2">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className={filterInputClasses} placeholder="Start" />
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className={filterInputClasses} placeholder="End" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Type</label>
                            <select value={selectedType} onChange={e => setSelectedType(e.target.value as any)} className={filterInputClasses}>
                                <option value="all">All Types</option>
                                <option value={TransactionType.INCOME}>Income</option>
                                <option value={TransactionType.EXPENSE}>Expense</option>
                            </select>
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
                    </div>
                 </div>

                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">Transaction Data ({filteredTransactions.length} records)</h2>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={filterInputClasses + " w-64"}
                        />
                         <Button variant="subtle" onClick={resetFilters}>Reset</Button>
                    </div>
                 </div>

                 {isLoading ? (
                     <div className="text-center p-4">Loading...</div>
                 ) : filteredTransactions.length === 0 ? (
                     <div className="text-center p-4">No transactions found.</div>
                 ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-gray-300 uppercase bg-[#0D0D12]">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Date</th>
                                        <th scope="col" className="px-6 py-3">Type</th>
                                        <th scope="col" className="px-6 py-3">Category</th>
                                        <th scope="col" className="px-6 py-3">Account</th>
                                        <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                        <th scope="col" className="px-6 py-3">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map(t => (
                                        <tr key={t.id} className="border-b border-[#2D2D3A] hover:bg-[#0D0D12]">
                                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(t.date)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{t.category}</td>
                                            <td className="px-6 py-4">{t.method}</td>
                                            <td className="px-6 py-4 text-right font-medium text-white">{formatCurrencyPHP(t.amount)}</td>
                                            <td className="px-6 py-4">{t.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Mobile Card View */}
                        <div className="space-y-4 md:hidden">
                            {filteredTransactions.map(t => (
                                <Card key={t.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-white">{t.category}</p>
                                            <p className="text-sm text-gray-400">{t.method}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {t.type}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                                            {t.notes && t.notes !== '—' && <p className="text-sm text-gray-300 mt-1 max-w-[150px] truncate">{t.notes}</p>}
                                        </div>
                                        <p className={`font-semibold text-lg ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatCurrencyPHP(t.amount)}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                 )}
            </Card>

        </div>
    );
};

export default DataManagement;