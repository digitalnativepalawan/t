
import { IVendorsData, Vendor, Transaction } from './IData';

const VENDORS_KEY = 'bbbo.vendors.v1';
const TRANSACTIONS_KEY = 'bbbo.vendorTx.v1';

export class VendorsLocal implements IVendorsData {
    constructor() {
        this._seedData();
    }

    private _generateId(): string {
        if (crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    private _getVendors(): Vendor[] {
        try {
            const stored = localStorage.getItem(VENDORS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    private _saveVendors(vendors: Vendor[]): void {
        localStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
    }

    private _getTransactions(): Transaction[] {
        try {
            const stored = localStorage.getItem(TRANSACTIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    private _saveTransactions(transactions: Transaction[]): void {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    }

    private _seedData(): void {
        const vendors = this._getVendors();
        if (vendors.length === 0) {
            const demoVendor: Vendor = {
                id: this._generateId(),
                name: 'Demo Supplier',
                contact: 'John Doe',
                email: 'demo@supplier.com',
                phone: '123-456-7890',
                notes: 'This is a demo vendor created on first run.',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this._saveVendors([demoVendor]);

            const demoTransaction: Transaction = {
                id: this._generateId(),
                vendorId: demoVendor.id,
                amount: 1500,
                type: 'charge',
                date: new Date().toISOString().split('T')[0],
                note: 'Initial charge for services.',
                createdAt: new Date().toISOString()
            };
            this._saveTransactions([demoTransaction]);
        }
    }

    private _calculateBalances(vendors: Vendor[], allTransactions: Transaction[]): Vendor[] {
        const txByVendor = new Map<string, Transaction[]>();
        allTransactions.forEach(tx => {
            if (!txByVendor.has(tx.vendorId)) {
                txByVendor.set(tx.vendorId, []);
            }
            txByVendor.get(tx.vendorId)!.push(tx);
        });

        return vendors.map(vendor => {
            const vendorTxs = txByVendor.get(vendor.id) || [];
            const balance = vendorTxs.reduce((bal, tx) => {
                if (tx.type === 'charge') {
                    return bal + tx.amount;
                } else if (tx.type === 'payment') {
                    return bal - tx.amount;
                }
                return bal;
            }, 0);
            return { ...vendor, balance };
        });
    }

    async listVendors(): Promise<Vendor[]> {
        const vendors = this._getVendors();
        const transactions = this._getTransactions();
        const vendorsWithBalance = this._calculateBalances(vendors, transactions);
        return Promise.resolve(vendorsWithBalance);
    }

    async getVendor(id: string): Promise<Vendor | null> {
        const vendors = this._getVendors();
        const vendor = vendors.find(v => v.id === id);
        if (!vendor) {
            return Promise.resolve(null);
        }
        const transactions = this._getTransactions().filter(tx => tx.vendorId === id);
        const [vendorWithBalance] = this._calculateBalances([vendor], transactions);
        return Promise.resolve(vendorWithBalance);
    }

    async createVendor(v: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'balance'>): Promise<Vendor> {
        const vendors = this._getVendors();
        const newVendor: Vendor = {
            ...v,
            id: this._generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        vendors.push(newVendor);
        this._saveVendors(vendors);
        return Promise.resolve({ ...newVendor, balance: 0 });
    }

    async updateVendor(id: string, patch: Partial<Vendor>): Promise<Vendor> {
        let vendors = this._getVendors();
        let updatedVendor: Vendor | null = null;
        vendors = vendors.map(v => {
            if (v.id === id) {
                updatedVendor = {
                    ...v,
                    ...patch,
                    id,
                    updatedAt: new Date().toISOString()
                };
                return updatedVendor;
            }
            return v;
        });

        if (!updatedVendor) {
            throw new Error(`Vendor with id ${id} not found`);
        }

        this._saveVendors(vendors);
        const transactions = this._getTransactions().filter(tx => tx.vendorId === id);
        const [vendorWithBalance] = this._calculateBalances([updatedVendor], transactions);
        return Promise.resolve(vendorWithBalance);
    }

    async deleteVendor(id: string): Promise<void> {
        const vendors = this._getVendors().filter(v => v.id !== id);
        this._saveVendors(vendors);

        const transactions = this._getTransactions().filter(tx => tx.vendorId !== id);
        this._saveTransactions(transactions);

        return Promise.resolve();
    }

    async listTransactions(vendorId?: string): Promise<Transaction[]> {
        let transactions = this._getTransactions();
        if (vendorId) {
            transactions = transactions.filter(tx => tx.vendorId === vendorId);
        }
        return Promise.resolve(transactions);
    }

    async addTransaction(t: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
        const transactions = this._getTransactions();
        const newTransaction: Transaction = {
            ...t,
            id: this._generateId(),
            createdAt: new Date().toISOString(),
        };
        transactions.push(newTransaction);
        this._saveTransactions(transactions);
        return Promise.resolve(newTransaction);
    }

    async deleteTransaction(id: string): Promise<void> {
        const transactions = this._getTransactions().filter(tx => tx.id !== id);
        this._saveTransactions(transactions);
        return Promise.resolve();
    }
}
