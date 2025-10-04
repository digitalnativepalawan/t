

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  currency: 'PHP';
  category: string;
  method: 'GCash' | 'RCBC' | 'EastWest' | 'PayPal' | 'Cash' | 'Direct';
  notes?: string;
  createdBy: string; // User ID
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Income extends Transaction {
  type: TransactionType.INCOME;
  source: string;
  referenceId?: string;
}

export interface Expense extends Transaction {
  type: TransactionType.EXPENSE;
  vendor: string;
  invoiceNo?: string;
  receiptImageUrl?: string;
}

export type AnyTransaction = Income | Expense;

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string; // User ID
  dueDate?: string; // ISO string
  relatedCost?: number;
  attachments?: string[]; // URLs
  comments?: { userId: string; text: string; createdAt: string }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundAccount {
  id: string;
  name: string;
  type: 'checking' | 'cash' | 'digital';
  institution: 'RCBC' | 'EastWest' | 'GCash' | 'PayPal' | 'Cash';
  balance: number;
  lastUpdated: string; // ISO string
  notes?: string;
  isHidden: boolean;
}

export enum PayrollStatus {
    DRAFT = 'draft',
    APPROVED = 'approved',
    PAID = 'paid',
}

export interface Deductions {
    sss: number;
    philhealth: number;
    pagibig: number;
    tax: number;
}

export interface Employee {
    id: string;
    name: string;
    position: string;
    rate: number; // hourly rate
    deductions: Deductions;
    hireDate: string; // ISO string
}

export interface PayrollEntry {
    id: string;
    employeeId: string;
    periodStart: string; // ISO string
    periodEnd: string; // ISO string
    grossPay: number;
    deductions: Deductions;
    netPay: number;
    status: PayrollStatus;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  email: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface LineItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string; // ISO string
  dueDate: string; // ISO string
  lineItems: LineItem[];
  taxRate: number;
  discount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string;
  status: InvoiceStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}