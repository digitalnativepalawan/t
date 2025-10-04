
import React, { useState, useEffect, useMemo } from 'react';
import KpiCard from '../components/ui/KpiCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { vendorsData } from '../services/vendorsData';
import { Vendor, Transaction } from '../services/vendorsData/IData';
import { PlusIcon, EllipsisVerticalIcon } from '../components/Icons';
import Modal from '../components/ui/Modal';
import { formatCurrencyPHP } from '../utils/formatters';

type FormValues = Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'balance'>;

// Vendor Form Component
const VendorForm: React.FC<{
    onSubmit: (values: FormValues) => void;
    onCancel: () => void;
    initialData?: Vendor | null;
}> = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState<FormValues>({
        name: initialData?.name || '',
        contact: initialData?.contact || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        notes: initialData?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Vendor Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required />
                </div>
                 <div>
                    <label className="text-xs text-gray-400 mb-1 block">Contact Person</label>
                    <input type="text" name="contact" value={formData.contact} onChange={handleChange} className={inputClasses} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} />
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className={inputClasses} rows={3}></textarea>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">{initialData ? 'Update Vendor' : 'Save Vendor'}</Button>
            </div>
        </form>
    );
};

// Log Payment Form Component
const LogPaymentForm: React.FC<{
    onSubmit: (values: { amount: number; date: string; note: string; type: 'payment' | 'charge' }) => void;
    onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [type, setType] = useState<'payment' | 'charge'>('payment');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if(isNaN(parsedAmount) || parsedAmount <= 0) {
            alert('Amount must be a number greater than zero.');
            return;
        }
        onSubmit({
            amount: parsedAmount,
            date: new Date(date).toISOString().split('T')[0],
            note,
            type,
        });
    };

    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Amount (PHP)</label>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Transaction Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClasses} required />
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Transaction Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className={inputClasses}>
                    <option value="payment">Payment to Vendor</option>
                    <option value="charge">Charge from Vendor</option>
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes (Optional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} className={inputClasses} rows={3}></textarea>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">Log Transaction</Button>
            </div>
        </form>
    );
};


const Vendors: React.FC = () => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [paymentTotals, setPaymentTotals] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
    const [loggingPaymentFor, setLoggingPaymentFor] = useState<Vendor | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    
    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [vendorsFromDb, transactionsData] = await Promise.all([vendorsData.listVendors(), vendorsData.listTransactions()]);
            setVendors(vendorsFromDb);
            setTransactions(transactionsData);

            const totals: Record<string, number> = {};
            const vendorMap = new Map(vendorsFromDb.map(v => [v.id, v.name]));
            transactionsData
                .filter((t) => t.type === 'payment')
                .forEach(payment => {
                    const vendorName = vendorMap.get(payment.vendorId);
                    if (vendorName) {
                        totals[vendorName] = (totals[vendorName] || 0) + payment.amount;
                    }
                });
            setPaymentTotals(totals);

        } catch (error) {
            console.error("Failed to fetch vendors and transactions:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const filteredVendors = useMemo(() => {
        return vendors
            .filter(v => {
                if (dateRange.start && v.createdAt && new Date(v.createdAt) < new Date(dateRange.start)) return false;
                if (dateRange.end) {
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(23, 59, 59, 999);
                    if (v.createdAt && new Date(v.createdAt) > endDate) return false;
                }
                return true;
            })
            .filter(v =>
                Object.values(v).some(val =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
    }, [vendors, searchTerm, dateRange]);

    const kpiData = useMemo(() => {
        const totalVendors = vendors.length;
        const totalPaid = Object.values(paymentTotals).reduce((sum: number, amount: number) => sum + amount, 0);
        return { totalVendors, totalPaid };
    }, [vendors, paymentTotals]);

    const resetFilters = () => {
        setSearchTerm('');
        setDateRange({ start: '', end: '' });
    };
    
    const handleAddVendor = () => {
        setEditingVendor(null);
        setIsModalOpen(true);
    };

    const handleEditVendor = (vendor: Vendor) => {
        setEditingVendor(vendor);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const handleDeleteVendor = (vendor: Vendor) => {
        setDeletingVendor(vendor);
        setActiveMenu(null);
    };

    const handleLogPayment = (vendor: Vendor) => {
        setLoggingPaymentFor(vendor);
        setActiveMenu(null);
    };

    const confirmDelete = async () => {
        if (!deletingVendor) return;
        try {
            await vendorsData.deleteVendor(deletingVendor.id);
            await fetchData();
        } catch (error) {
            console.error("Failed to delete vendor:", error);
        } finally {
            setDeletingVendor(null);
        }
    };

    const handleFormSubmit = async (values: FormValues) => {
        try {
            if (editingVendor) {
                await vendorsData.updateVendor(editingVendor.id, values);
            } else {
                await vendorsData.createVendor(values);
            }
            await fetchData();
        } catch (error) {
            console.error("Failed to save vendor:", error);
        } finally {
            setIsModalOpen(false);
            setEditingVendor(null);
        }
    };

    const handleLogPaymentSubmit = async (paymentData: { amount: number; date: string; note: string; type: 'payment' | 'charge' }) => {
        if (!loggingPaymentFor) return;

        try {
            await vendorsData.addTransaction({
                ...paymentData,
                vendorId: loggingPaymentFor.id,
            });
            await fetchData();
        } catch (error) {
            console.error("Failed to log transaction:", error);
        } finally {
            setLoggingPaymentFor(null);
        }
    };
    
    const filterInputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-1.5 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Vendors Management</h1>
                    <p className="text-gray-400 mt-1">Manage your suppliers and service providers.</p>
                </div>
                <Button variant="primary" leftIcon={<PlusIcon/>} onClick={handleAddVendor}>Add Vendor</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KpiCard title="Total Vendors" value={kpiData.totalVendors} isLoading={isLoading} isCurrency={false} />
                <KpiCard title="Total Paid to Vendors" value={kpiData.totalPaid} isLoading={isLoading} />
            </div>

            <Card>
                 <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Filter Vendors</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Created Date Range</label>
                            <div className="flex gap-2">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className={filterInputClasses} />
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className={filterInputClasses} />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                             <label className="text-xs text-gray-400 mb-1 block">Search</label>
                             <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search vendors..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={filterInputClasses}
                                />
                                <Button variant="subtle" onClick={resetFilters}>Reset</Button>
                             </div>
                        </div>
                    </div>
                 </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-[#0D0D12]">
                            <tr>
                                <th scope="col" className="px-6 py-3">Vendor Name</th>
                                <th scope="col" className="px-6 py-3">Contact Person</th>
                                <th scope="col" className="px-6 py-3">Contact Info</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Paid</th>
                                <th scope="col" className="px-6 py-3 text-right">Balance</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#2D2D3A]">
                                        <td colSpan={6} className="p-4"><div className="h-8 bg-gray-700 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : filteredVendors.map(vendor => {
                                const totalPaidToVendor = paymentTotals[vendor.name] || 0;
                                return (
                                <tr key={vendor.id} className="border-b border-[#2D2D3A] hover:bg-[#0D0D12]">
                                    <td className="px-6 py-4 font-medium text-white">{vendor.name}</td>
                                    <td className="px-6 py-4">{vendor.contact || '—'}</td>
                                    <td className="px-6 py-4">
                                        {vendor.email && <div>{vendor.email}</div>}
                                        {vendor.phone && <div className="text-xs">{vendor.phone}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-300">{formatCurrencyPHP(totalPaidToVendor)}</td>
                                    <td className={`px-6 py-4 text-right font-semibold ${vendor.balance && vendor.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrencyPHP(vendor.balance || 0)}</td>
                                    <td className="px-6 py-4 text-center">
                                         <div className="relative inline-block">
                                            <button onClick={() => setActiveMenu(activeMenu === vendor.id ? null : vendor.id)} className="text-gray-400 hover:text-white">
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {activeMenu === vendor.id && (
                                                <div className="absolute right-0 mt-2 w-40 bg-[#2D2D3A] border border-[#4a4a5a] rounded-md shadow-lg z-10 text-left">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleLogPayment(vendor); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c4a]">Log Transaction</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEditVendor(vendor); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c4a]">Edit</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteVendor(vendor); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-[#3c3c4a]">Delete</a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {!isLoading && filteredVendors.length === 0 && <div className="text-center p-4">No vendors found. Add one to get started.</div>}
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'} size="lg">
                <VendorForm 
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingVendor}
                />
            </Modal>

            <Modal isOpen={!!deletingVendor} onClose={() => setDeletingVendor(null)} title="Delete Vendor?">
                {deletingVendor && (
                    <div>
                        <p className="text-gray-300">Are you sure you want to delete {deletingVendor.name}? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button variant="secondary" onClick={() => setDeletingVendor(null)}>Cancel</Button>
                            <Button variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={confirmDelete}>Delete</Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={!!loggingPaymentFor} onClose={() => setLoggingPaymentFor(null)} title={`Log Transaction for ${loggingPaymentFor?.name}`} size="lg">
                <LogPaymentForm
                    onSubmit={handleLogPaymentSubmit}
                    onCancel={() => setLoggingPaymentFor(null)}
                />
            </Modal>

        </div>
    );
};

export default Vendors;
