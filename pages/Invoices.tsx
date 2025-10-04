import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Product, Invoice, InvoiceStatus, LineItem } from '../types';
import { getCustomers, getProducts, addCustomer, getInvoices, addInvoice } from '../services/mockApi';
import { formatCurrencyPHP, formatDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { DocumentArrowDownIcon, TrashIcon, ArrowUturnLeftIcon } from '../components/Icons';

declare const jspdf: any;

// Customer Form Component
const CustomerForm: React.FC<{
    onSubmit: (values: Omit<Customer, 'id'>) => void;
    onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', address: '', email: '', phone: '' });

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
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Customer Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required autoFocus />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClasses} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} required />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Phone (Optional)</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} />
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">Save Customer</Button>
            </div>
        </form>
    );
};

const getNextInvoiceNumber = (): string => {
    const INVOICE_COUNTER_KEY = 'haloblocInvoiceCounter';
    const currentYear = new Date().getFullYear();
    let counterData;

    try {
        const stored = localStorage.getItem(INVOICE_COUNTER_KEY);
        // Initialize with counter 0, so the first invoice is #1
        counterData = stored ? JSON.parse(stored) : { year: currentYear, counter: 0 };
    } catch (e) {
        console.error("Failed to parse invoice counter from localStorage:", e);
        // Fallback
        counterData = { year: currentYear, counter: 0 };
    }
    
    // Reset counter to 1 if the year has changed
    if(counterData.year !== currentYear) {
        counterData = { year: currentYear, counter: 1 };
    } else {
        // Otherwise, just increment
        counterData.counter += 1;
    }

    localStorage.setItem(INVOICE_COUNTER_KEY, JSON.stringify(counterData));
    
    return `INV-${currentYear}-${String(counterData.counter).padStart(4, '0')}`;
};

const statusConfig = {
    [InvoiceStatus.DRAFT]: { label: 'Draft', color: 'bg-gray-500/10 text-gray-400' },
    [InvoiceStatus.PAID]: { label: 'Paid', color: 'bg-green-500/10 text-green-400' },
    [InvoiceStatus.OVERDUE]: { label: 'Overdue', color: 'bg-red-500/10 text-red-400' },
};

const StatusPill: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
    const config = statusConfig[status] || { label: 'Unknown', color: 'bg-gray-700' };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${config.color}`}>
            {config.label}
        </span>
    );
};

type SortableKeys = 'invoiceNumber' | 'customerName' | 'invoiceDate' | 'dueDate' | 'total' | 'status';


const Invoices: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [taxRate, setTaxRate] = useState(12);
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('Thank you for your business. Please make payment by the due date.');
    const [productToAddId, setProductToAddId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    
    // New state for VAT and customer modal
    const [vatNumber, setVatNumber] = useState('');
    const [isNonVat, setIsNonVat] = useState(false);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for invoice list
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [customerData, productData, invoiceData] = await Promise.all([getCustomers(), getProducts(), getInvoices()]);
            setCustomers(customerData);
            setProducts(productData);
            setSavedInvoices(invoiceData);
            if (productData.length > 0) {
                setProductToAddId(productData[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setInvoiceNumber(getNextInvoiceNumber());
    }, []);

    useEffect(() => {
        if (isNonVat) {
            setVatNumber('');
        }
    }, [isNonVat]);

    const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);

    const { subtotal, taxAmount, total } = useMemo(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const taxAmount = isNonVat ? 0 : subtotal * (taxRate / 100);
        const total = subtotal + taxAmount - discount;
        return { subtotal, taxAmount, total };
    }, [lineItems, taxRate, discount, isNonVat]);
    
    const handleAddItem = () => {
        if (!productToAddId) return;
        const product = products.find(p => p.id === productToAddId);
        if (!product) return;

        const existingItem = lineItems.find(item => item.productId === product.id);
        if (existingItem) {
            handleUpdateItem(existingItem.id, 'quantity', existingItem.quantity + 1);
        } else {
            const newItem: LineItem = {
                id: crypto.randomUUID(),
                productId: product.id,
                name: product.name,
                quantity: 1,
                unitPrice: product.price,
            };
            setLineItems(prev => [...prev, newItem]);
        }
    };

    const handleUpdateItem = (id: string, field: 'quantity' | 'unitPrice', value: number) => {
        if(value < 0) return;
        setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveItem = (id: string) => {
        setLineItems(prev => prev.filter(item => item.id !== id));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSaveCustomer = async (customerData: Omit<Customer, 'id'>) => {
        try {
            const newCustomer = await addCustomer(customerData);
            setCustomers(prev => [newCustomer, ...prev]);
            setSelectedCustomerId(newCustomer.id);
            setIsAddCustomerModalOpen(false);
        } catch (error) {
            console.error("Failed to add customer:", error);
        }
    };

    const handleReset = () => {
        setLineItems([]);
        setSelectedCustomerId('');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setInvoiceNumber(getNextInvoiceNumber());
        setTaxRate(12);
        setDiscount(0);
        setNotes('Thank you for your business. Please make payment by the due date.');
        setVatNumber('');
        setIsNonVat(false);
    };

    const handleSaveInvoice = async () => {
        if (!selectedCustomerId) {
            alert("Please select a customer.");
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        
        const newInvoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
            invoiceNumber,
            customerId: selectedCustomerId,
            invoiceDate,
            dueDate,
            lineItems,
            taxRate: isNonVat ? 0 : taxRate,
            discount,
            subtotal,
            taxAmount,
            total,
            notes,
            status: InvoiceStatus.DRAFT,
        };

        try {
            await addInvoice(newInvoiceData);
            await fetchData();
            alert('Invoice saved successfully!');
            handleReset();
        } catch(e) {
            console.error("Failed to save invoice:", e);
            alert('An error occurred while saving the invoice.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrencyForPdf = (amount: number): string => {
        if (typeof amount !== 'number') return '0.00';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const handleDownloadPdf = () => {
        if (!selectedCustomer) {
            alert("Please select a customer before downloading the PDF.");
            return;
        }

        const { jsPDF } = jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'in', format: 'letter' });
        const margin = 0.5;
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = margin;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#000000');

        doc.setFontSize(22);
        doc.text('HaloBloc Inc.', margin, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Boutique Resorts & Modular Homes', margin, yPos + 0.25);
        doc.text('El Nido, Palawan, Philippines', margin, yPos + 0.4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(26);
        doc.text('INVOICE', doc.internal.pageSize.getWidth() - margin, yPos, { align: 'right' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`# ${invoiceNumber}`, doc.internal.pageSize.getWidth() - margin, yPos + 0.25, { align: 'right' });

        yPos += 1.0;

        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(selectedCustomer.name, margin, yPos + 0.2);
        doc.text(selectedCustomer.address, margin, yPos + 0.35);
        doc.text(selectedCustomer.email, margin, yPos + 0.5);
        if (selectedCustomer.phone) {
          doc.text(selectedCustomer.phone, margin, yPos + 0.65);
        }
        
        const vatText = `VAT Number: ${isNonVat ? 'N/A' : vatNumber}`;
        doc.setFontSize(8);
        doc.text(vatText, margin, yPos + 0.85);

        doc.setFontSize(10);
        doc.text(`Invoice Date: ${invoiceDate ? new Date(invoiceDate).toLocaleDateString() : ''}`, doc.internal.pageSize.getWidth() - margin, yPos, { align: 'right' });
        doc.text(`Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : ''}`, doc.internal.pageSize.getWidth() - margin, yPos + 0.2, { align: 'right' });
        
        yPos += 1.2;

        const tableHead = [['Item', 'Qty', 'Unit Price', 'Total']];
        const tableBody = lineItems.map(item => [
            item.name,
            item.quantity.toString(),
            formatCurrencyForPdf(item.unitPrice),
            formatCurrencyForPdf(item.quantity * item.unitPrice)
        ]);

        doc.autoTable({
            startY: yPos,
            head: tableHead,
            body: tableBody,
            theme: 'grid',
            headStyles: { 
                fillColor: [255, 255, 255], 
                textColor: [0, 0, 0], 
                fontStyle: 'bold',
                lineColor: [0, 0, 0],
                lineWidth: 0.01
            },
            styles: { 
                cellPadding: 0.1, 
                fontSize: 10, 
                valign: 'middle', 
                overflow: 'linebreak',
                lineColor: [200, 200, 200],
                lineWidth: 0.01,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 4.0 },
                1: { cellWidth: 0.75, halign: 'center' },
                2: { cellWidth: 1.25, halign: 'right' },
                3: { cellWidth: 1.5, halign: 'right' }
            },
            margin: { left: margin, right: margin },
        });

        yPos = doc.autoTable.previous.finalY + 0.2;

        const summaryBody = [
            ['Subtotal', formatCurrencyForPdf(subtotal)],
            [`VAT (${isNonVat ? '0' : taxRate}%)`, formatCurrencyForPdf(taxAmount)],
            ['Discount', `-${formatCurrencyForPdf(discount)}`],
            [{ content: 'Total Due', styles: { fontStyle: 'bold', fontSize: 12 } }, { content: formatCurrencyForPdf(total), styles: { fontStyle: 'bold', fontSize: 12 } }]
        ];

        doc.autoTable({
            startY: yPos,
            body: summaryBody,
            theme: 'plain',
            tableWidth: 'wrap',
            styles: { cellPadding: 0.1, fontSize: 10, textColor: [0,0,0] },
            columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right' } },
            margin: { left: doc.internal.pageSize.getWidth() - 3.5, right: margin },
        });
        
        yPos = doc.autoTable.previous.finalY;

        if (pageHeight - yPos < 1.5) { 
            doc.addPage();
            yPos = margin;
        } else {
            yPos += 0.5;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Notes', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(notes, doc.internal.pageSize.getWidth() - (margin * 2));
        doc.text(splitNotes, margin, yPos + 0.2);

        doc.save(`Invoice-${invoiceNumber}.pdf`);
    };

    const processedInvoices = useMemo(() => {
        const customerMap = new Map(customers.map(c => [c.id, c.name]));
        type CombinedInvoice = Invoice & { customerName: string };

        let filtered = savedInvoices.map(inv => ({
            ...inv,
            customerName: customerMap.get(inv.customerId) || 'Unknown Customer',
        })).filter(inv => {
            if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
            
            const searchLower = invoiceSearch.toLowerCase();
            if (invoiceSearch && !(
                inv.invoiceNumber.toLowerCase().includes(searchLower) ||
                inv.customerName.toLowerCase().includes(searchLower)
            )) return false;

            const invoiceDateObj = new Date(inv.invoiceDate);
            if (filterDateRange.start) {
                const startDate = new Date(filterDateRange.start);
                startDate.setHours(0,0,0,0);
                if (invoiceDateObj < startDate) return false;
            }
            if (filterDateRange.end) {
                const endDate = new Date(filterDateRange.end);
                endDate.setHours(23,59,59,999);
                if (invoiceDateObj > endDate) return false;
            }

            return true;
        });

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [savedInvoices, customers, filterStatus, invoiceSearch, sortConfig, filterDateRange]);
    
    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };
    
    const handleResetFilters = () => {
        setFilterStatus('all');
        setInvoiceSearch('');
        setFilterDateRange({ start: '', end: '' });
    };

    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none disabled:opacity-50";
    const labelClasses = "text-xs text-gray-400 mb-1 block font-medium";
    const tableHeaderButtonClasses = "font-semibold text-white print-text-black flex items-center gap-1";

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-white">Invoice Generator</h1>
                    <p className="text-gray-400 mt-1">Create and manage professional invoices.</p>
                </div>
                <div className="flex space-x-2 flex-wrap">
                    <Button variant="subtle" leftIcon={<ArrowUturnLeftIcon />} onClick={handleReset}>Reset</Button>
                    <Button variant="secondary" onClick={handleSaveInvoice} disabled={isSaving || !selectedCustomerId || lineItems.length === 0}>
                        {isSaving ? 'Saving...' : 'Save Invoice'}
                    </Button>
                    <Button variant="secondary" leftIcon={<DocumentArrowDownIcon />} onClick={handleDownloadPdf}>Download PDF</Button>
                    <Button variant="primary" onClick={handlePrint}>Print Invoice</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 space-y-6 no-print">
                    <h2 className="text-xl font-semibold text-white">Invoice Details</h2>
                    <div>
                        <label htmlFor="customer" className={labelClasses}>Customer</label>
                        <div className="flex gap-2">
                            <select id="customer" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className={`${inputClasses} flex-grow`}>
                                <option value="" disabled>Select a customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <Button variant="secondary" onClick={() => setIsAddCustomerModalOpen(true)}>Add</Button>
                        </div>
                    </div>
                     <div className="border-t border-[#2D2D3A] pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="invoiceDate" className={labelClasses}>Invoice Date</label>
                                <input type="date" id="invoiceDate" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="dueDate" className={labelClasses}>Due Date</label>
                                <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClasses} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#2D2D3A] pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="vatNumber" className={labelClasses}>VAT Number</label>
                            <div className="flex items-center">
                                <input id="nonVat" type="checkbox" checked={isNonVat} onChange={e => setIsNonVat(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-[#0D0D12]" />
                                <label htmlFor="nonVat" className="ml-2 text-sm text-gray-300">NON VAT</label>
                            </div>
                        </div>
                        <input type="text" id="vatNumber" value={vatNumber} onChange={e => setVatNumber(e.target.value)} className={inputClasses} placeholder="e.g. 123-456-789-000" disabled={isNonVat} />
                     
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="taxRate" className={labelClasses}>Tax Rate (%)</label>
                                <input type="number" id="taxRate" value={isNonVat ? 0 : taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className={inputClasses} disabled={isNonVat} />
                            </div>
                            <div>
                                <label htmlFor="discount" className={labelClasses}>Discount (PHP)</label>
                                <input type="number" id="discount" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className={inputClasses} />
                            </div>
                        </div>
                     </div>
                    <div className="border-t border-[#2D2D3A] pt-4">
                        <label htmlFor="notes" className={labelClasses}>Notes / Payment Terms</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4} className={inputClasses}></textarea>
                    </div>
                </Card>

                <div className="lg:col-span-2">
                   <Card className="p-8 printable-area" id="invoice-preview">
                        <div className="print-bg-white print-text-black">
                             <header className="flex justify-between items-start pb-6 border-b print-border-gray border-[#2D2D3A]">
                                <div>
                                    <h1 className="text-3xl font-bold print-text-black text-white">HaloBloc Inc.</h1>
                                    <p className="text-sm text-gray-400 print-text-black">Boutique Resorts & Modular Homes</p>
                                    <p className="text-sm text-gray-400 print-text-black">El Nido, Palawan, Philippines</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-semibold text-gray-400 print-text-black uppercase tracking-widest">Invoice</h2>
                                    <p className="text-sm text-gray-300 print-text-black mt-2"># {invoiceNumber}</p>
                                </div>
                            </header>

                            <section className="grid grid-cols-2 gap-8 my-6">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-gray-400 print-text-black">Bill To:</h3>
                                    {selectedCustomer ? (
                                        <>
                                            <p className="font-bold text-white print-text-black">{selectedCustomer.name}</p>
                                            <p className="text-sm text-gray-300 print-text-black">{selectedCustomer.address}</p>
                                            <p className="text-sm text-gray-300 print-text-black">{selectedCustomer.email}</p>
                                            <p className="text-xs text-gray-400 print-text-black mt-2">VAT Number: {isNonVat ? 'N/A' : vatNumber}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 print-text-black italic">Select a customer</p>
                                    )}
                                </div>
                                <div className="space-y-1 text-right">
                                     <p className="text-gray-400 print-text-black"><strong>Invoice Date:</strong> {invoiceDate && new Date(invoiceDate).toLocaleDateString()}</p>
                                     <p className="text-gray-400 print-text-black"><strong>Due Date:</strong> {dueDate && new Date(dueDate).toLocaleDateString()}</p>
                                </div>
                            </section>

                            <section>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#0D0D12] print-bg-white">
                                        <tr>
                                            <th className="px-4 py-2 font-semibold text-white print-text-black">Item</th>
                                            <th className="px-4 py-2 font-semibold text-white print-text-black text-center w-24">Qty</th>
                                            <th className="px-4 py-2 font-semibold text-white print-text-black text-right w-32">Unit Price</th>
                                            <th className="px-4 py-2 font-semibold text-white print-text-black text-right w-32">Total</th>
                                            <th className="w-10 no-print"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineItems.map(item => (
                                            <tr key={item.id} className="border-b border-[#2D2D3A] print-border-gray">
                                                <td className="px-4 py-3 text-white print-text-black">{item.name}</td>
                                                <td className="px-4 py-3">
                                                    <input type="number" value={item.quantity} min="1" onChange={e => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value))} className={`${inputClasses} text-center`}/>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-300 print-text-black">{formatCurrencyPHP(item.unitPrice)}</td>
                                                <td className="px-4 py-3 text-right text-white print-text-black font-medium">{formatCurrencyPHP(item.quantity * item.unitPrice)}</td>
                                                <td className="px-4 py-3 text-center no-print">
                                                    <button onClick={() => handleRemoveItem(item.id)} className="text-gray-500 hover:text-red-400">
                                                        <TrashIcon className="h-4 w-4"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="mt-4 flex items-center gap-2 no-print">
                                    <select value={productToAddId} onChange={(e) => setProductToAddId(e.target.value)} className={`${inputClasses} flex-grow`}>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrencyPHP(p.price)}</option>)}
                                    </select>
                                    <Button variant="secondary" onClick={handleAddItem} disabled={!productToAddId}>Add Item</Button>
                                </div>
                            </section>

                            <section className="flex justify-end mt-8">
                                <div className="w-full max-w-xs space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-300 print-text-black">
                                        <span>Subtotal</span>
                                        <span>{formatCurrencyPHP(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300 print-text-black">
                                        <span>VAT ({isNonVat ? '0' : taxRate}%)</span>
                                        <span>{formatCurrencyPHP(taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300 print-text-black">
                                        <span>Discount</span>
                                        <span className="text-green-400">-{formatCurrencyPHP(discount)}</span>
                                    </div>
                                    <div className="flex justify-between text-white print-text-black font-bold text-lg pt-2 border-t border-[#2D2D3A] print-border-gray">
                                        <span>Total Due</span>
                                        <span>{formatCurrencyPHP(total)}</span>
                                    </div>
                                </div>
                            </section>
                            
                            <footer className="mt-12 pt-6 border-t border-[#2D2D3A] print-border-gray">
                                <h4 className="font-semibold text-gray-400 print-text-black mb-2">Notes</h4>
                                <p className="text-xs text-gray-400 print-text-black">{notes}</p>
                            </footer>
                        </div>
                   </Card>
                </div>
            </div>
            
            <Card className="no-print">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Saved Invoices</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className={labelClasses}>Invoice Date Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={filterDateRange.start}
                                    onChange={e => setFilterDateRange(p => ({ ...p, start: e.target.value }))}
                                    className={inputClasses}
                                    aria-label="Filter start date"
                                />
                                <input
                                    type="date"
                                    value={filterDateRange.end}
                                    onChange={e => setFilterDateRange(p => ({ ...p, end: e.target.value }))}
                                    className={inputClasses}
                                    aria-label="Filter end date"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Status</label>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className={inputClasses}
                            >
                                <option value="all">All Statuses</option>
                                <option value={InvoiceStatus.DRAFT}>Draft</option>
                                <option value={InvoiceStatus.PAID}>Paid</option>
                                <option value={InvoiceStatus.OVERDUE}>Overdue</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Search</label>
                            <input
                                type="text"
                                placeholder="By # or customer..."
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <Button variant="subtle" onClick={handleResetFilters}>Reset Filters</Button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-[#0D0D12]">
                            <tr>
                                <th scope="col" className="px-4 py-3"><button onClick={() => requestSort('invoiceNumber')} className={tableHeaderButtonClasses}>Invoice # {getSortIndicator('invoiceNumber')}</button></th>
                                <th scope="col" className="px-4 py-3"><button onClick={() => requestSort('customerName')} className={tableHeaderButtonClasses}>Customer {getSortIndicator('customerName')}</button></th>
                                <th scope="col" className="px-4 py-3"><button onClick={() => requestSort('invoiceDate')} className={tableHeaderButtonClasses}>Invoice Date {getSortIndicator('invoiceDate')}</button></th>
                                <th scope="col" className="px-4 py-3"><button onClick={() => requestSort('dueDate')} className={tableHeaderButtonClasses}>Due Date {getSortIndicator('dueDate')}</button></th>
                                <th scope="col" className="px-4 py-3 text-right"><button onClick={() => requestSort('total')} className={tableHeaderButtonClasses + " justify-end"}>Total {getSortIndicator('total')}</button></th>
                                <th scope="col" className="px-4 py-3 text-center"><button onClick={() => requestSort('status')} className={tableHeaderButtonClasses + " justify-center"}>Status {getSortIndicator('status')}</button></th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedInvoices.map(inv => (
                                <tr key={inv.id} className="border-b border-[#2D2D3A] hover:bg-[#0D0D12]">
                                    <td className="px-4 py-3 font-medium text-white">{inv.invoiceNumber}</td>
                                    <td className="px-4 py-3">{inv.customerName}</td>
                                    <td className="px-4 py-3">{formatDate(inv.invoiceDate)}</td>
                                    <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-white">{formatCurrencyPHP(inv.total)}</td>
                                    <td className="px-4 py-3 text-center"><StatusPill status={inv.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoading && processedInvoices.length === 0 && <div className="text-center p-4">No saved invoices found.</div>}
                </div>
            </Card>

            <Modal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)} title="Add New Customer">
                <CustomerForm 
                    onSubmit={handleSaveCustomer}
                    onCancel={() => setIsAddCustomerModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Invoices;