import { AnyTransaction, FundAccount, Task, TransactionType, TaskStatus, TaskPriority, Income, Expense, Employee, PayrollEntry, PayrollStatus, Deductions, Vendor, Customer, Product, Invoice, InvoiceStatus, LineItem } from '../types';

// --- LocalStorage Helpers ---
const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue);
        }
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
    }
    // If nothing is stored, save the default value for next time
    saveToLocalStorage(key, defaultValue);
    return defaultValue;
};

const saveToLocalStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage for key "${key}":`, error);
    }
};


const today = new Date();
const getDate = (daysAgo: number) => new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

// --- LocalStorage Keys ---
const FUND_ACCOUNTS_KEY = 'halobloc_fund_accounts';
const TRANSACTIONS_KEY = 'halobloc_transactions';
const TASKS_KEY = 'halobloc_tasks';
const EMPLOYEES_KEY = 'halobloc_employees';
const PAYROLL_ENTRIES_KEY = 'halobloc_payroll_entries';
const VENDORS_KEY = 'halobloc_vendors';
const CUSTOMERS_KEY = 'halobloc_customers';
const PRODUCTS_KEY = 'halobloc_products';
const INVOICES_KEY = 'halobloc_invoices';

// --- Initial Mock Data (used as fallback) ---

const initialFundAccounts: FundAccount[] = [
  { id: '1', name: 'PayPal', type: 'digital', institution: 'PayPal', balance: 37500, lastUpdated: getDate(1), isHidden: false, notes: 'PayPal digital wallet account' },
  { id: '2', name: 'GCash', type: 'digital', institution: 'GCash', balance: 125000, lastUpdated: getDate(0), isHidden: false, notes: 'GCash mobile wallet account' },
  { id: '3', name: 'Bank Transfer (EastWest)', type: 'checking', institution: 'EastWest', balance: 1025678, lastUpdated: getDate(2), isHidden: false, notes: 'EastWest Bank account for transfers' },
  { id: '4', name: 'Bank Transfer (RCBC Bank)', type: 'checking', institution: 'RCBC', balance: 2332164, lastUpdated: getDate(1), isHidden: false, notes: 'RCBC Bank account for transfers' },
  { id: '5', name: 'Cash', type: 'cash', institution: 'Cash', balance: 50000, lastUpdated: getDate(3), isHidden: false, notes: 'Physical cash on hand' },
];

const initialTransactions: AnyTransaction[] = [
    { id: 't1', type: TransactionType.INCOME, date: getDate(1), amount: 15200, currency: 'PHP', category: 'Accommodation', method: 'PayPal', source: 'Accommodation', createdBy: 'admin', createdAt: getDate(1), updatedAt: getDate(1) } as Income,
    { id: 't2', type: TransactionType.EXPENSE, date: getDate(2), amount: 2500, currency: 'PHP', category: 'F&B', method: 'GCash', vendor: 'Local Market', invoiceNo: 'LM-001', createdBy: 'admin', createdAt: getDate(2), updatedAt: getDate(2) } as Expense,
    { id: 't3', type: TransactionType.INCOME, date: getDate(3), amount: 38002.88, currency: 'PHP', category: 'Accommodation', method: 'EastWest', source: 'Accommodation', createdBy: 'admin', createdAt: getDate(3), updatedAt: getDate(3) } as Income,
    { id: 't4', type: TransactionType.EXPENSE, date: getDate(4), amount: 1200, currency: 'PHP', category: 'Utilities', method: 'Cash', vendor: 'Electric Co.', createdBy: 'admin', createdAt: getDate(4), updatedAt: getDate(4) } as Expense,
    { id: 't5', type: TransactionType.INCOME, date: getDate(5), amount: 19530, currency: 'PHP', category: 'Accommodation', method: 'RCBC', source: 'Accommodation', createdBy: 'admin', createdAt: getDate(5), updatedAt: getDate(5) } as Income,
    { id: 't6', type: TransactionType.EXPENSE, date: getDate(6), amount: 5500, currency: 'PHP', category: 'Repairs', method: 'Cash', vendor: 'Handyman Services', invoiceNo: 'HS-2023-11-20', createdBy: 'admin', createdAt: getDate(6), updatedAt: getDate(6) } as Expense,
    { id: 't7', type: TransactionType.INCOME, date: getDate(7), amount: 22000, currency: 'PHP', category: 'Accommodation', method: 'GCash', source: 'Accommodation', createdBy: 'admin', createdAt: getDate(7), updatedAt: getDate(7) } as Income,
    { id: 't8', type: TransactionType.EXPENSE, date: getDate(8), amount: 780, currency: 'PHP', category: 'Telecom', method: 'PayPal', vendor: 'Internet Provider', createdBy: 'admin', createdAt: getDate(8), updatedAt: getDate(8) } as Expense,
    { id: 't9', type: TransactionType.INCOME, date: getDate(9), amount: 12500, currency: 'PHP', category: 'F&B', method: 'Cash', source: 'F&B', createdBy: 'admin', createdAt: getDate(9), updatedAt: getDate(9) } as Income,
    { id: 't10', type: TransactionType.EXPENSE, date: getDate(10), amount: 3200, currency: 'PHP', category: 'Materials', method: 'RCBC', vendor: 'Hardware Store', invoiceNo: 'INV-9876', createdBy: 'admin', createdAt: getDate(10), updatedAt: getDate(10) } as Expense,
    { id: 't11', type: TransactionType.INCOME, date: getDate(11), amount: 8500, currency: 'PHP', category: 'Tours', method: 'GCash', source: 'Tours', createdBy: 'admin', createdAt: getDate(11), updatedAt: getDate(11) } as Income,
    { id: 't12', type: TransactionType.EXPENSE, date: getDate(12), amount: 15000, currency: 'PHP', category: 'Labor', method: 'Cash', vendor: 'Construction Crew', invoiceNo: 'CC-001', createdBy: 'admin', createdAt: getDate(12), updatedAt: getDate(12) } as Expense,
    { id: 't13', type: TransactionType.EXPENSE, date: getDate(13), amount: 20000, currency: 'PHP', category: 'Professional Services', method: 'RCBC', vendor: 'Accounting Firm', invoiceNo: 'AF-2023-01', createdBy: 'admin', createdAt: getDate(13), updatedAt: getDate(13) } as Expense,
];

const initialTasks: Task[] = [
    { id: 'task1', title: 'Restock pantry items', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: 'staff-1', dueDate: getDate(-2), createdBy: 'admin', createdAt: getDate(5), updatedAt: getDate(5) },
    { 
      id: 'task2', 
      title: 'Service air conditioning units', 
      status: TaskStatus.IN_PROGRESS, 
      priority: TaskPriority.HIGH, 
      assignee: 'manager-1', 
      dueDate: getDate(-4), 
      createdBy: 'admin', 
      createdAt: getDate(7), 
      updatedAt: getDate(2),
      attachments: ['https://picsum.photos/seed/ac1/200/300'],
      comments: [
        { userId: 'admin', text: 'Scheduled with the technician for Tuesday.', createdAt: getDate(3) },
        { userId: 'manager-1', text: 'Technician confirmed. All units will be checked.', createdAt: getDate(2) }
      ]
    },
    { id: 'task3', title: 'Update website with new photos', status: TaskStatus.COMPLETED, priority: TaskPriority.LOW, assignee: 'manager-1', createdBy: 'admin', createdAt: getDate(10), updatedAt: getDate(1) },
    { 
      id: 'task4', 
      title: 'Prepare monthly expense report', 
      status: TaskStatus.IN_PROGRESS, 
      priority: TaskPriority.HIGH, 
      assignee: 'admin', 
      dueDate: getDate(0), 
      createdBy: 'admin', 
      createdAt: getDate(3), 
      updatedAt: getDate(3),
      comments: [
        { userId: 'admin', text: 'I need the final numbers from the F&B department.', createdAt: getDate(1) }
      ]
    },
    { id: 'task5', title: 'Follow up on vendor invoice #5821', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: 'admin', createdBy: 'admin', createdAt: getDate(6), updatedAt: getDate(4), description: 'Waiting for confirmation from the vendor about the price discrepancy.' },
    { id: 'task6', title: 'Schedule fire safety inspection', status: TaskStatus.TODO, priority: TaskPriority.HIGH, assignee: 'manager-1', dueDate: getDate(-10), createdBy: 'admin', createdAt: getDate(15), updatedAt: getDate(15) },
];

const initialEmployees: Employee[] = [
  { id: 'emp1', name: 'David Le', position: 'Resort Manager', rate: 300, deductions: { sss: 1125, philhealth: 437.5, pagibig: 100, tax: 2479.17 }, hireDate: getDate(365) },
  { id: 'emp2', name: 'Quennie O', position: 'Front Desk Officer', rate: 150, deductions: { sss: 562.5, philhealth: 218.75, pagibig: 100, tax: 0 }, hireDate: getDate(180) },
  { id: 'emp3', name: 'Ron Ron', position: 'Maintenance Staff', rate: 120, deductions: { sss: 450, philhealth: 175, pagibig: 100, tax: 0 }, hireDate: getDate(90) },
  { id: 'emp4', name: 'Accountan', position: 'Housekeeping Supervisor', rate: 130, deductions: { sss: 495, philhealth: 192.5, pagibig: 100, tax: 0 }, hireDate: getDate(600) },
];

const initialPayrollEntries: PayrollEntry[] = [
    { id: 'pr1', employeeId: 'emp1', periodStart: '2023-11-01T00:00:00.000Z', periodEnd: '2023-11-15T00:00:00.000Z', grossPay: 25000, deductions: { sss: 1125, philhealth: 437.5, pagibig: 100, tax: 2479.17 }, netPay: 20858.33, status: PayrollStatus.PAID },
    { id: 'pr2', employeeId: 'emp2', periodStart: '2023-11-01T00:00:00.000Z', periodEnd: '2023-11-15T00:00:00.000Z', grossPay: 12500, deductions: { sss: 562.5, philhealth: 218.75, pagibig: 100, tax: 0 }, netPay: 11618.75, status: PayrollStatus.PAID },
    { id: 'pr3', employeeId: 'emp3', periodStart: '2023-11-01T00:00:00.000Z', periodEnd: '2023-11-15T00:00:00.000Z', grossPay: 10000, deductions: { sss: 450, philhealth: 175, pagibig: 100, tax: 0 }, netPay: 9275, status: PayrollStatus.PAID },
    { id: 'pr4', employeeId: 'emp4', periodStart: '2023-11-01T00:00:00.000Z', periodEnd: '2023-11-15T00:00:00.000Z', grossPay: 11000, deductions: { sss: 495, philhealth: 192.5, pagibig: 100, tax: 0 }, netPay: 10212.5, status: PayrollStatus.PAID },
    { id: 'pr5', employeeId: 'emp1', periodStart: '2023-11-16T00:00:00.000Z', periodEnd: '2023-11-30T00:00:00.000Z', grossPay: 25000, deductions: { sss: 1125, philhealth: 437.5, pagibig: 100, tax: 2479.17 }, netPay: 20858.33, status: PayrollStatus.APPROVED },
    { id: 'pr6', employeeId: 'emp2', periodStart: '2023-11-16T00:00:00.000Z', periodEnd: '2023-11-30T00:00:00.000Z', grossPay: 12500, deductions: { sss: 562.5, philhealth: 218.75, pagibig: 100, tax: 0 }, netPay: 11618.75, status: PayrollStatus.APPROVED },
    { id: 'pr7', employeeId: 'emp3', periodStart: '2023-11-16T00:00:00.000Z', periodEnd: '2023-11-30T00:00:00.000Z', grossPay: 10000, deductions: { sss: 450, philhealth: 175, pagibig: 100, tax: 0 }, netPay: 9275, status: PayrollStatus.DRAFT },
    { id: 'pr8', employeeId: 'emp4', periodStart: '2023-11-16T00:00:00.000Z', periodEnd: '2023-11-30T00:00:00.000Z', grossPay: 11000, deductions: { sss: 495, philhealth: 192.5, pagibig: 100, tax: 0 }, netPay: 10212.5, status: PayrollStatus.DRAFT },
];

const initialVendors: Vendor[] = [
  { id: 'v1', name: 'Local Market', category: 'F&B', contactPerson: 'Maria Dela Cruz', email: 'maria@localmarket.com', phone: '09171234567', createdAt: getDate(30), updatedAt: getDate(5) },
  { id: 'v2', name: 'Electric Co.', category: 'Utilities', contactPerson: 'Juan Santos', email: 'billing@electricco.ph', phone: '0288887777', createdAt: getDate(90), updatedAt: getDate(10) },
  { id: 'v3', name: 'Handyman Services', category: 'Repairs', contactPerson: 'Bob Builder', email: 'bob@handyman.com', phone: '09229876543', createdAt: getDate(60), updatedAt: getDate(2) },
  { id: 'v4', name: 'Internet Provider', category: 'Telecom', contactPerson: 'Support Desk', email: 'support@internet.ph', phone: '0277301000', createdAt: getDate(120), updatedAt: getDate(8) },
  { id: 'v5', name: 'Hardware Store', category: 'Materials', contactPerson: 'Henry Sy', email: 'contact@hardware.com', phone: '09181112222', createdAt: getDate(45), updatedAt: getDate(15) },
  { id: 'v6', name: 'Construction Crew', category: 'Labor', contactPerson: 'Manny P.', email: 'manny@construction.com', phone: '09191234567', createdAt: getDate(12), updatedAt: getDate(12) },
  { id: 'v7', name: 'Accounting Firm', category: 'Professional Services', contactPerson: 'Ms. Auditor', email: 'audit@firm.com', phone: '0281234567', createdAt: getDate(13), updatedAt: getDate(13) },
];

const initialCustomers: Customer[] = [
  { id: 'cust1', name: 'Resort Guest A', address: 'Villa 1, Luxury Resort, Palawan', email: 'guest.a@example.com' },
  { id: 'cust2', name: 'Modular Home Client B', address: '123 Main St, Metro Manila', email: 'client.b@example.com' },
  { id: 'cust3', name: 'Event Organizer C', address: '456 Business Park, Cebu City', email: 'events.c@example.com' },
];

const initialProducts: Product[] = [
  { id: 'prod1', name: 'Overnight Stay - Deluxe Villa', price: 15000 },
  { id: 'prod2', name: 'Island Hopping Tour (per person)', price: 2500 },
  { id: 'prod3', name: 'Restaurant - Dinner Set', price: 1800 },
  { id: 'prod4', name: 'Modular Unit - Design Consultation', price: 5000 },
  { id: 'prod5', name: 'Modular Unit - Base Model', price: 850000 },
  { id: 'prod6', name: 'Construction Materials Delivery', price: 3500 },
];

const initialInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2024-0001',
    customerId: 'cust1',
    invoiceDate: getDate(10),
    dueDate: getDate(-5), // 5 days from now
    lineItems: [
      { id: 'li1', productId: 'prod1', name: 'Overnight Stay - Deluxe Villa', quantity: 2, unitPrice: 15000 },
    ],
    taxRate: 12,
    discount: 0,
    subtotal: 30000,
    taxAmount: 3600,
    total: 33600,
    notes: 'Thank you for your stay.',
    status: InvoiceStatus.DRAFT,
    createdAt: getDate(10),
    updatedAt: getDate(10),
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-2024-0002',
    customerId: 'cust2',
    invoiceDate: getDate(35),
    dueDate: getDate(20), // overdue
    lineItems: [
      { id: 'li2', productId: 'prod5', name: 'Modular Unit - Base Model', quantity: 1, unitPrice: 850000 },
      { id: 'li3', productId: 'prod6', name: 'Construction Materials Delivery', quantity: 3, unitPrice: 3500 },
    ],
    taxRate: 12,
    discount: 10000,
    subtotal: 860500,
    taxAmount: 103260,
    total: 953760,
    notes: 'Modular home project payment.',
    status: InvoiceStatus.OVERDUE,
    createdAt: getDate(35),
    updatedAt: getDate(35),
  },
  {
    id: 'inv3',
    invoiceNumber: 'INV-2023-0003',
    customerId: 'cust3',
    invoiceDate: getDate(45),
    dueDate: getDate(30),
    lineItems: [
      { id: 'li4', productId: 'prod2', name: 'Island Hopping Tour (per person)', quantity: 10, unitPrice: 2500 },
    ],
    taxRate: 0,
    discount: 0,
    subtotal: 25000,
    taxAmount: 0,
    total: 25000,
    notes: 'Event payment.',
    status: InvoiceStatus.PAID,
    createdAt: getDate(45),
    updatedAt: getDate(30),
  },
];


let mockFundAccounts: FundAccount[] = getFromLocalStorage(FUND_ACCOUNTS_KEY, initialFundAccounts);
let mockTransactions: AnyTransaction[] = getFromLocalStorage(TRANSACTIONS_KEY, initialTransactions);
let mockTasks: Task[] = getFromLocalStorage(TASKS_KEY, initialTasks);
let mockEmployees: Employee[] = getFromLocalStorage(EMPLOYEES_KEY, initialEmployees);
let mockPayrollEntries: PayrollEntry[] = getFromLocalStorage(PAYROLL_ENTRIES_KEY, initialPayrollEntries);
let mockVendors: Vendor[] = getFromLocalStorage(VENDORS_KEY, initialVendors);
let mockCustomers: Customer[] = getFromLocalStorage(CUSTOMERS_KEY, initialCustomers);
let mockProducts: Product[] = getFromLocalStorage(PRODUCTS_KEY, initialProducts);
let mockInvoices: Invoice[] = getFromLocalStorage(INVOICES_KEY, initialInvoices);


const apiRequest = <T,>(data: T, delay = 500): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), delay));

export const getFundAccounts = () => apiRequest(mockFundAccounts);
export const getTransactions = () => apiRequest(mockTransactions);
export const getTasks = () => apiRequest(mockTasks);
export const getEmployees = () => apiRequest(mockEmployees);
export const getPayrollEntries = () => apiRequest(mockPayrollEntries);
export const getVendors = () => apiRequest(mockVendors);
export const getCustomers = () => apiRequest(mockCustomers);
export const getProducts = () => apiRequest(mockProducts);
export const getInvoices = () => apiRequest(mockInvoices);

export const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInvoice: Invoice = {
        ...invoiceData,
        id: `inv${new Date().getTime()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockInvoices = [newInvoice, ...mockInvoices];
    saveToLocalStorage(INVOICES_KEY, mockInvoices);
    return apiRequest(newInvoice);
};

export const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'createdBy'>) => {
    const newTask: Task = {
        ...taskData,
        id: `task${new Date().getTime()}`,
        status: TaskStatus.TODO, // New tasks always start in 'To Do'
        createdBy: 'admin', // Assume admin is creating
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockTasks = [newTask, ...mockTasks];
    saveToLocalStorage(TASKS_KEY, mockTasks);
    return apiRequest(newTask);
};

export const updateTask = (taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    let updatedTask: Task | undefined;
    mockTasks = mockTasks.map(task => {
        if (task.id === taskId) {
            updatedTask = {
                ...task,
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            return updatedTask;
        }
        return task;
    });
    if (!updatedTask) throw new Error("Task not found");
    saveToLocalStorage(TASKS_KEY, mockTasks);
    return apiRequest(updatedTask);
};

export const deleteTask = (taskId: string) => {
    const taskToDelete = mockTasks.find(t => t.id === taskId);
    if (!taskToDelete) throw new Error("Task not found");
    mockTasks = mockTasks.filter(t => t.id !== taskId);
    saveToLocalStorage(TASKS_KEY, mockTasks);
    return apiRequest(taskToDelete);
};

export const addTaskComment = (taskId: string, text: string, userId: string) => {
    let updatedTask: Task | undefined;
    mockTasks = mockTasks.map(task => {
        if (task.id === taskId) {
            const newComment = {
                userId,
                text,
                createdAt: new Date().toISOString(),
            };
            const comments = task.comments ? [...task.comments, newComment] : [newComment];
            updatedTask = {
                ...task,
                comments,
                updatedAt: new Date().toISOString(),
            };
            return updatedTask;
        }
        return task;
    });
    if (!updatedTask) throw new Error("Task not found");
    saveToLocalStorage(TASKS_KEY, mockTasks);
    return apiRequest(updatedTask);
};

export const addTaskAttachment = (taskId: string, attachmentUrl: string) => {
    let updatedTask: Task | undefined;
    mockTasks = mockTasks.map(task => {
        if (task.id === taskId) {
            const newAttachments = task.attachments ? [...task.attachments, attachmentUrl] : [attachmentUrl];
            updatedTask = {
                ...task,
                attachments: newAttachments,
                updatedAt: new Date().toISOString(),
            };
            return updatedTask;
        }
        return task;
    });
    if (!updatedTask) throw new Error("Task not found");
    saveToLocalStorage(TASKS_KEY, mockTasks);
    return apiRequest(updatedTask);
};

export const deleteTaskAttachment = (taskId: string, attachmentUrl: string) => {
    let updatedTask: Task | undefined;
    mockTasks = mockTasks.map(task => {
        if (task.id === taskId) {
            updatedTask = {
                ...task,
                attachments: task.attachments?.filter(url => url !== attachmentUrl),
                updatedAt: new Date().toISOString(),
            };
            return updatedTask;
        }
        return task;
    });
    if (!updatedTask) throw new Error("Task not found");
    saveToLocalStorage(TASKS_KEY, mockTasks);
    return apiRequest(updatedTask);
};

export const updateTaskComment = (taskId: string, commentIndex: number, newText: string) => {
    let updatedTask: Task | undefined;
    mockTasks = mockTasks.map(task => {
        if (task.id === taskId && task.comments && task.comments[commentIndex]) {
            const newComments = [...task.comments];
            newComments[commentIndex] = { ...newComments[commentIndex], text: newText, createdAt: new Date().toISOString() };
            updatedTask = {
                ...task,
                comments: newComments,
                updatedAt: new Date().toISOString(),
            };
            return updatedTask;
        }
        return task;
    });
    if (!updatedTask) throw new Error("Task or comment not found");
    saveToLocalStorage(TASKS_KEY, mockTasks);
    return apiRequest(updatedTask);
};

export const deleteTaskComment = (taskId: string, commentIndex: number) => {
    let updatedTask: Task | undefined;
    mockTasks = mockTasks.map(task => {
        if (task.id === taskId && task.comments) {
            const newComments = [...task.comments];
            newComments.splice(commentIndex, 1);
            updatedTask = {
                ...task,
                comments: newComments,
                updatedAt: new Date().toISOString(),
            };
            return updatedTask;
        }
        return task;
    });
    if (!updatedTask) throw new Error("Task not found");
    saveToLocalStorage(TASKS_KEY, mockTasks);
    return apiRequest(updatedTask);
};

export const addFundAccount = (accountData: Omit<FundAccount, 'id' | 'lastUpdated' | 'isHidden'>) => {
    const newAccount: FundAccount = {
        ...accountData,
        id: new Date().getTime().toString(),
        lastUpdated: new Date().toISOString(),
        isHidden: false,
    };
    mockFundAccounts = [newAccount, ...mockFundAccounts];
    saveToLocalStorage(FUND_ACCOUNTS_KEY, mockFundAccounts);
    return apiRequest(newAccount);
};

export const updateFundAccount = (accountId: string, updates: Partial<FundAccount>) => {
    let updatedAccount: FundAccount | undefined;
    mockFundAccounts = mockFundAccounts.map(acc => {
        if (acc.id === accountId) {
            updatedAccount = { ...acc, ...updates, lastUpdated: new Date().toISOString() };
            return updatedAccount;
        }
        return acc;
    });
    if (!updatedAccount) throw new Error("Account not found");
    saveToLocalStorage(FUND_ACCOUNTS_KEY, mockFundAccounts);
    return apiRequest(updatedAccount);
}

export const deleteFundAccount = (accountId: string) => {
    const accountToDelete = mockFundAccounts.find(acc => acc.id === accountId);
    if (!accountToDelete) throw new Error("Account not found");
    mockFundAccounts = mockFundAccounts.filter(acc => acc.id !== accountId);
    saveToLocalStorage(FUND_ACCOUNTS_KEY, mockFundAccounts);
    return apiRequest(accountToDelete);
}

export const addVendor = (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVendor: Vendor = {
        ...vendorData,
        id: `v${new Date().getTime()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockVendors = [newVendor, ...mockVendors];
    saveToLocalStorage(VENDORS_KEY, mockVendors);
    return apiRequest(newVendor);
};

export const updateVendor = (vendorId: string, updates: Partial<Omit<Vendor, 'id'>>) => {
    let updatedVendor: Vendor | undefined;
    mockVendors = mockVendors.map(v => {
        if (v.id === vendorId) {
            updatedVendor = { 
                ...v, 
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            return updatedVendor;
        }
        return v;
    });
    if (!updatedVendor) throw new Error("Vendor not found");
    saveToLocalStorage(VENDORS_KEY, mockVendors);
    return apiRequest(updatedVendor);
};

export const deleteVendor = (vendorId: string) => {
    const vendorToDelete = mockVendors.find(v => v.id === vendorId);
    if (!vendorToDelete) throw new Error("Vendor not found");
    mockVendors = mockVendors.filter(v => v.id !== vendorId);
    saveToLocalStorage(VENDORS_KEY, mockVendors);
    return apiRequest(vendorToDelete);
};

export const addPayrollRun = (entries: Omit<PayrollEntry, 'id' | 'status'>[]) => {
    const newEntries: PayrollEntry[] = entries.map((entry, index) => ({
        ...entry,
        id: `pr${new Date().getTime()}${index}`,
        status: PayrollStatus.DRAFT,
    }));
    mockPayrollEntries = [...newEntries, ...mockPayrollEntries];
    saveToLocalStorage(PAYROLL_ENTRIES_KEY, mockPayrollEntries);
    return apiRequest(newEntries);
};

export const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
        ...employeeData,
        id: `emp${new Date().getTime()}`,
        deductions: employeeData.deductions || { sss: 0, philhealth: 0, pagibig: 0, tax: 0 },
    };
    mockEmployees = [newEmployee, ...mockEmployees];
    saveToLocalStorage(EMPLOYEES_KEY, mockEmployees);
    return apiRequest(newEmployee);
};

export const updateEmployee = (employeeId: string, updates: Partial<Omit<Employee, 'id'>>) => {
    let updatedEmployee: Employee | undefined;
    mockEmployees = mockEmployees.map(emp => {
        if (emp.id === employeeId) {
            updatedEmployee = { 
                ...emp, 
                ...updates,
                deductions: { ...emp.deductions, ...updates.deductions },
            };
            return updatedEmployee;
        }
        return emp;
    });
    if (!updatedEmployee) throw new Error("Employee not found");
    saveToLocalStorage(EMPLOYEES_KEY, mockEmployees);
    return apiRequest(updatedEmployee);
};

export const deleteEmployee = (employeeId: string) => {
    const employeeToDelete = mockEmployees.find(emp => emp.id === employeeId);
    if (!employeeToDelete) throw new Error("Employee not found");
    mockEmployees = mockEmployees.filter(emp => emp.id !== employeeId);
    saveToLocalStorage(EMPLOYEES_KEY, mockEmployees);
    return apiRequest(employeeToDelete);
};

export const addTransactions = (transactions: Omit<AnyTransaction, 'id'>[]) => {
    // Fix: Cast the mapped object to AnyTransaction to resolve a TypeScript inference issue.
    // When spreading a discriminated union, TypeScript can fail to preserve the specific type
    // (Income or Expense), leading to a type error. The cast assures the compiler that
    // the object structure is correct.
    const newTransactions: AnyTransaction[] = transactions.map((t, index) => ({
        ...t,
        id: `csv-${new Date().getTime()}-${index}`,
    }) as AnyTransaction);
    mockTransactions = [...newTransactions, ...mockTransactions];
    saveToLocalStorage(TRANSACTIONS_KEY, mockTransactions);
    return apiRequest(newTransactions);
};

export const addCustomer = (customerData: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = {
        ...customerData,
        id: `cust${new Date().getTime()}`,
    };
    mockCustomers = [newCustomer, ...mockCustomers];
    saveToLocalStorage(CUSTOMERS_KEY, mockCustomers);
    return apiRequest(newCustomer);
};