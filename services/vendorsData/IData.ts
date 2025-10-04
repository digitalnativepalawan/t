
export type Vendor = {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  notes?: string;
  balance?: number; // derived from transactions
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
};

export type Transaction = {
  id: string;
  vendorId: string;
  amount: number;          // positive = payment received (reduces vendor balance)
  type: 'payment' | 'charge';
  date: string;            // ISO YYYY-MM-DD
  note?: string;
  createdAt?: string;      // ISO
};

export interface IVendorsData {
  listVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | null>;
  createVendor(v: Omit<Vendor, 'id'|'createdAt'|'updatedAt'|'balance'>): Promise<Vendor>;
  updateVendor(id: string, patch: Partial<Vendor>): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;
  listTransactions(vendorId?: string): Promise<Transaction[]>;
  addTransaction(t: Omit<Transaction, 'id'|'createdAt'>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
}
