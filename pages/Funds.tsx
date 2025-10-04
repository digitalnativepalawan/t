import React, { useState, useEffect, useMemo } from 'react';
import KpiCard from '../components/ui/KpiCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getFundAccounts, addFundAccount, updateFundAccount, deleteFundAccount } from '../services/mockApi';
import { FundAccount } from '../types';
import { formatCurrencyPHP, formatDate } from '../utils/formatters';
import { EyeIcon, EyeOffIcon, PlusIcon, EllipsisVerticalIcon } from '../components/Icons';
import Modal from '../components/ui/Modal';

type FormValues = Omit<FundAccount, 'id' | 'lastUpdated' | 'isHidden'>;

const AccountForm: React.FC<{
    onSubmit: (values: FormValues) => void;
    onCancel: () => void;
    initialData?: FundAccount | null;
}> = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState<FormValues>({
        name: initialData?.name || '',
        // Fix: Provide a valid default value for 'institution' to prevent a type error. An empty string is not assignable to the 'institution' property's type.
        institution: initialData?.institution || 'GCash',
        type: initialData?.type || 'checking',
        balance: initialData?.balance || 0,
        notes: initialData?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'balance' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Account Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Institution</label>
                <input type="text" name="institution" value={formData.institution} onChange={handleChange} className={inputClasses} required />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Account Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className={inputClasses}>
                    <option value="checking">Checking</option>
                    <option value="cash">Cash</option>
                    <option value="digital">Digital</option>
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Opening Balance</label>
                <input type="number" name="balance" value={formData.balance} onChange={handleChange} className={inputClasses} required />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className={inputClasses} rows={3}></textarea>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">{initialData ? 'Update Account' : 'Save Account'}</Button>
            </div>
        </form>
    );
};


const FundAccountCard: React.FC<{
    account: FundAccount;
    balancesVisible: boolean;
    onEdit: (account: FundAccount) => void;
    onDelete: (account: FundAccount) => void;
}> = ({ account, balancesVisible, onEdit, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    
    const typePillClasses = {
        digital: 'bg-blue-500/10 text-blue-400',
        checking: 'bg-green-500/10 text-green-400',
        cash: 'bg-yellow-500/10 text-yellow-400',
    };
    
    return (
        <Card className="flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-white">{account.name}</h3>
                    <div className="relative">
                        <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-400 hover:text-white">
                            <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-[#2D2D3A] border border-[#4a4a5a] rounded-md shadow-lg z-10">
                                <a onClick={(e) => { e.preventDefault(); onEdit(account); setMenuOpen(false); }} href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c4a]">Edit</a>
                                <a onClick={(e) => { e.preventDefault(); onDelete(account); setMenuOpen(false); }} href="#" className="block px-4 py-2 text-sm text-red-400 hover:bg-[#3c3c4a]">Delete</a>
                            </div>
                        )}
                    </div>
                </div>
                 <p className="text-sm text-gray-400 mt-1">{account.institution} - <span className={`text-xs capitalize`}>{account.type}</span></p>

            </div>
            <div className="mt-6">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-2xl font-bold text-white">
                    {balancesVisible ? formatCurrencyPHP(account.balance) : '₱ ••••••'}
                </p>
                <p className="text-xs text-gray-500 mt-2">Updated {formatDate(account.lastUpdated)}</p>
            </div>
        </Card>
    );
};

const Funds: React.FC = () => {
    const [accounts, setAccounts] = useState<FundAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [balancesVisible, setBalancesVisible] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<FundAccount | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<FundAccount | null>(null);


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getFundAccounts();
            setAccounts(data);
        } catch (error) {
            console.error("Failed to fetch fund accounts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const kpiData = useMemo(() => {
        const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const totalLiabilities = 0; // Placeholder
        const netWorth = totalAssets - totalLiabilities;
        return { totalAssets, totalLiabilities, netWorth };
    }, [accounts]);
    
    const handleAddAccount = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleEditAccount = (account: FundAccount) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleDeleteAccount = (account: FundAccount) => {
        setDeletingAccount(account);
    };

    const confirmDelete = async () => {
        if (!deletingAccount) return;
        try {
            await deleteFundAccount(deletingAccount.id);
            setAccounts(prev => prev.filter(acc => acc.id !== deletingAccount.id));
        } catch (error) {
            console.error("Failed to delete account:", error);
        } finally {
            setDeletingAccount(null);
        }
    };

    const handleFormSubmit = async (values: FormValues) => {
        try {
            if (editingAccount) {
                const updated = await updateFundAccount(editingAccount.id, values);
                setAccounts(prev => prev.map(acc => acc.id === updated.id ? updated : acc));
            } else {
                const newAccount = await addFundAccount(values);
                setAccounts(prev => [newAccount, ...prev]);
            }
        } catch (error) {
            console.error("Failed to save account:", error);
        } finally {
            setIsModalOpen(false);
            setEditingAccount(null);
        }
    };


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Funds Management</h1>
                    <p className="text-gray-400 mt-1">Monitor and manage your accounts and cash flow.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="secondary" onClick={() => setBalancesVisible(!balancesVisible)} leftIcon={balancesVisible ? <EyeOffIcon /> : <EyeIcon />}>
                        {balancesVisible ? 'Hide' : 'Show'} Balances
                    </Button>
                    <Button variant="primary" leftIcon={<PlusIcon/>} onClick={handleAddAccount}>Add Account</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Total Assets" value={kpiData.totalAssets} isLoading={isLoading} />
                <KpiCard title="Total Liabilities" value={kpiData.totalLiabilities} isLoading={isLoading} />
                <KpiCard title="Net Worth" value={kpiData.netWorth} isLoading={isLoading} />
            </div>

            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Assets ({accounts.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <Card key={i} className="animate-pulse h-48"><div className="h-full bg-gray-700 rounded"></div></Card>)
                    ) : (
                        accounts.map(acc => 
                            <FundAccountCard 
                                key={acc.id} 
                                account={acc} 
                                balancesVisible={balancesVisible}
                                onEdit={handleEditAccount}
                                onDelete={handleDeleteAccount}
                            />)
                    )}
                </div>
            </div>

            <div>
                 <h2 className="text-xl font-semibold text-white mb-4">Liabilities (0)</h2>
                 <Card className="text-center py-12">
                     <div className="mx-auto h-12 w-12 text-gray-500">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 21Z" /></svg>
                     </div>
                     <h3 className="mt-2 text-lg font-semibold text-white">No liability accounts</h3>
                     <p className="mt-1 text-sm text-gray-400">Add credit cards or loans to track your liabilities.</p>
                     <div className="mt-6">
                         <Button variant="primary" leftIcon={<PlusIcon/>}>Add Liability Account</Button>
                     </div>
                 </Card>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAccount ? 'Edit Account' : 'Add New Account'}>
                <AccountForm 
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingAccount}
                />
            </Modal>

            <Modal isOpen={!!deletingAccount} onClose={() => setDeletingAccount(null)} title="Delete Account?">
                {deletingAccount && (
                    <div>
                        <p className="text-gray-300">Are you sure you want to delete the "{deletingAccount.name}" account? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button variant="secondary" onClick={() => setDeletingAccount(null)}>Cancel</Button>
                            <Button variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={confirmDelete}>Delete</Button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default Funds;