


import React, { useState, useEffect, useMemo } from 'react';
import KpiCard from '../components/ui/KpiCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getPayrollEntries, getEmployees, addPayrollRun } from '../services/mockApi';
import { PayrollEntry, Employee, PayrollStatus, Deductions } from '../types';
import { formatCurrencyPHP, formatDate, downloadCSV } from '../utils/formatters';
import { DocumentArrowDownIcon, EllipsisVerticalIcon, PlusIcon } from '../components/Icons';
import Modal from '../components/ui/Modal';

type CombinedPayrollData = PayrollEntry & { employee?: Employee };

type EmployeePayrollData = {
    hoursWorked: number;
    deductions: Deductions;
};

const RunPayrollForm: React.FC<{
    employees: Employee[];
    onCancel: () => void;
    onSubmit: (entries: Omit<PayrollEntry, 'id' | 'status'>[]) => void;
}> = ({ employees, onCancel, onSubmit }) => {
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [payrollData, setPayrollData] = useState<Record<string, EmployeePayrollData>>({});

    useEffect(() => {
        const initialData: Record<string, EmployeePayrollData> = {};
        employees.forEach(emp => {
            initialData[emp.id] = {
                hoursWorked: 80, // Default to 80 hours for a semi-monthly period
                deductions: emp.deductions || { sss: 0, philhealth: 0, pagibig: 0, tax: 0 }
            };
        });
        setPayrollData(initialData);
    }, [employees]);

    const handleDataChange = (employeeId: string, field: keyof EmployeePayrollData | keyof Deductions, value: string) => {
        const numericValue = parseFloat(value) || 0;
        setPayrollData(prev => {
            const empData = prev[employeeId];
            if (!empData) {
                return prev;
            }

            const newEmpData = { ...empData, deductions: { ...empData.deductions } };

            if (field === 'hoursWorked') {
                newEmpData.hoursWorked = numericValue;
            } else if (field in newEmpData.deductions) {
                newEmpData.deductions[field as keyof Deductions] = numericValue;
            }
            
            return { ...prev, [employeeId]: newEmpData };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!periodStart || !periodEnd) {
            alert("Please select a payroll period.");
            return;
        }

        const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
        const newEntries: Omit<PayrollEntry, 'id' | 'status'>[] = Object.entries(payrollData)
            // Fix: Explicitly type the destructured parameters to resolve 'unknown' type errors.
            .map(([employeeId, data]: [string, EmployeePayrollData]) => {
                const employee = employeeMap.get(employeeId);
                if (!employee) return null;

                const grossPay = employee.rate * data.hoursWorked;
                const totalDeductions = Object.values(data.deductions).reduce((sum, d) => sum + d, 0);
                return {
                    employeeId,
                    periodStart: new Date(periodStart).toISOString(),
                    periodEnd: new Date(periodEnd).toISOString(),
                    grossPay: grossPay,
                    deductions: data.deductions,
                    netPay: grossPay - totalDeductions,
                };
            })
            .filter((entry): entry is Omit<PayrollEntry, 'id' | 'status'> => entry !== null);
        
        onSubmit(newEntries);
    };

    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-md px-2 py-1 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Period Start</label>
                    <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Period End</label>
                    <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className={inputClasses} required />
                </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto pr-2">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-[#0D0D12] sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Employee</th>
                            <th className="px-4 py-2">Hours Worked</th>
                            <th className="px-4 py-2">Gross Pay</th>
                            <th className="px-4 py-2">SSS</th>
                            <th className="px-4 py-2">PhilHealth</th>
                            <th className="px-4 py-2">Pag-IBIG</th>
                            <th className="px-4 py-2">Tax</th>
                            <th className="px-4 py-2">Net Pay</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300">
                        {employees.map(emp => {
                            // Fix: Explicitly type `data` to resolve 'unknown' type errors in calculations.
                            const data: EmployeePayrollData = payrollData[emp.id] || { hoursWorked: 0, deductions: { sss: 0, philhealth: 0, pagibig: 0, tax: 0 }};
                            const grossPay = emp.rate * data.hoursWorked;
                            const totalDeductions = Object.values(data.deductions).reduce((sum, d) => sum + d, 0);
                            const netPay = grossPay - totalDeductions;
                            return (
                                <tr key={emp.id} className="border-b border-[#2D2D3A]">
                                    <td className="px-4 py-2 font-medium">{emp.name}</td>
                                    <td><input type="number" value={data.hoursWorked} onChange={e => handleDataChange(emp.id, 'hoursWorked', e.target.value)} className={inputClasses} /></td>
                                    <td className="px-4 py-2">{formatCurrencyPHP(grossPay)}</td>
                                    <td><input type="number" value={data.deductions.sss} onChange={e => handleDataChange(emp.id, 'sss', e.target.value)} className={inputClasses} /></td>
                                    <td><input type="number" value={data.deductions.philhealth} onChange={e => handleDataChange(emp.id, 'philhealth', e.target.value)} className={inputClasses} /></td>
                                    <td><input type="number" value={data.deductions.pagibig} onChange={e => handleDataChange(emp.id, 'pagibig', e.target.value)} className={inputClasses} /></td>
                                    <td><input type="number" value={data.deductions.tax} onChange={e => handleDataChange(emp.id, 'tax', e.target.value)} className={inputClasses} /></td>
                                    <td className="px-4 py-2 font-semibold text-white">{formatCurrencyPHP(netPay)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end space-x-2 pt-6">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">Process Payroll</Button>
            </div>
        </form>
    );
};


const statusConfig = {
    [PayrollStatus.DRAFT]: { label: 'Draft', color: 'bg-gray-500/10 text-gray-400' },
    [PayrollStatus.APPROVED]: { label: 'Approved', color: 'bg-blue-500/10 text-blue-400' },
    [PayrollStatus.PAID]: { label: 'Paid', color: 'bg-green-500/10 text-green-400' },
};

const StatusPill: React.FC<{ status: PayrollStatus }> = ({ status }) => {
    const config = statusConfig[status];
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${config.color}`}>
            {config.label}
        </span>
    );
};

const Payroll: React.FC = () => {
    const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isRunPayrollModalOpen, setIsRunPayrollModalOpen] = useState(false);

    // Filter state
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedStatus, setSelectedStatus] = useState<PayrollStatus | 'all'>('all');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [payrollData, employeeData] = await Promise.all([getPayrollEntries(), getEmployees()]);
            setPayrollEntries(payrollData);
            setEmployees(employeeData);
        } catch (error) {
            console.error("Failed to fetch payroll data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const combinedData: CombinedPayrollData[] = useMemo(() => {
        const employeeMap = new Map(employees.map(e => [e.id, e]));
        return payrollEntries.map(p => ({
            ...p,
            employee: employeeMap.get(p.employeeId),
        }));
    }, [payrollEntries, employees]);

    const filteredData = useMemo(() => {
        return combinedData
            .filter(p => {
                if (!dateRange.start && !dateRange.end) return true;
            
                const periodStart = new Date(p.periodStart);
                const periodEnd = new Date(p.periodEnd);
                
                const filterStart = dateRange.start ? new Date(dateRange.start) : null;
                let filterEnd = dateRange.end ? new Date(dateRange.end) : null;

                if (filterEnd) {
                    filterEnd.setHours(23, 59, 59, 999);
                }
                
                if(filterStart && filterEnd) {
                    // Overlap logic: (StartDate1 <= EndDate2) and (StartDate2 <= EndDate1)
                    return periodStart <= filterEnd && periodEnd >= filterStart;
                } else if (filterStart) {
                    return periodEnd >= filterStart;
                } else if (filterEnd) {
                    return periodStart <= filterEnd;
                }
                return true;
            })
            .filter(p => selectedStatus === 'all' || p.status === selectedStatus)
            .filter(p => selectedEmployeeId === 'all' || p.employeeId === selectedEmployeeId);
    }, [combinedData, dateRange, selectedStatus, selectedEmployeeId]);

    const kpiData = useMemo(() => {
        const totalGross = filteredData.reduce((sum, item) => sum + item.grossPay, 0);
        const totalNet = filteredData.reduce((sum, item) => sum + item.netPay, 0);
        const totalDeductions = totalGross - totalNet;
        return { totalGross, totalNet, totalDeductions };
    }, [filteredData]);

    const resetFilters = () => {
        setDateRange({ start: '', end: '' });
        setSelectedStatus('all');
        setSelectedEmployeeId('all');
    };

    const handleRunPayrollSubmit = async (newEntries: Omit<PayrollEntry, 'id' | 'status'>[]) => {
        try {
            await addPayrollRun(newEntries);
            setIsRunPayrollModalOpen(false);
            await fetchData();
        } catch (error) {
            console.error("Failed to run new payroll:", error);
        }
    };

    const handleExportCSV = () => {
        if (filteredData.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = ['Employee', 'Position', 'Gross Pay', 'SSS', 'PhilHealth', 'Pag-IBIG', 'Tax', 'Total Deductions', 'Net Pay', 'Status'];
        const rows = filteredData.map(item => {
            const totalDeductions = item.grossPay - item.netPay;
            return [
                item.employee?.name || 'N/A',
                item.employee?.position || 'N/A',
                item.grossPay,
                item.deductions.sss,
                item.deductions.philhealth,
                item.deductions.pagibig,
                item.deductions.tax,
                totalDeductions,
                item.netPay,
                item.status
            ];
        });

        const periodLabel = (dateRange.start || dateRange.end) ? `${dateRange.start}_to_${dateRange.end}` : 'all-periods';
        downloadCSV(headers, rows, `payroll-export-${periodLabel}.csv`);
    };
    
    const filterInputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-1.5 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Payroll Management</h1>
                    <p className="text-gray-400 mt-1">Process, review, and manage employee payroll.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="secondary" leftIcon={<DocumentArrowDownIcon/>} onClick={handleExportCSV}>Export CSV</Button>
                    <Button variant="primary" leftIcon={<PlusIcon/>} onClick={() => setIsRunPayrollModalOpen(true)}>Run New Payroll</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Total Payroll Cost (Gross)" value={kpiData.totalGross} isLoading={isLoading} />
                <KpiCard title="Total Net Pay" value={kpiData.totalNet} isLoading={isLoading} />
                <KpiCard title="Total Deductions" value={kpiData.totalDeductions} isLoading={isLoading} />
            </div>

            <Card>
                 <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Filter Payroll Runs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Period Range</label>
                            <div className="flex gap-2">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className={filterInputClasses} />
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className={filterInputClasses} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Status</label>
                            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as any)} className={filterInputClasses}>
                                <option value="all">All Statuses</option>
                                {Object.entries(statusConfig).map(([status, {label}]) => <option key={status} value={status}>{label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Employee</label>
                            <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className={filterInputClasses}>
                                <option value="all">All Employees</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <Button variant="subtle" onClick={resetFilters}>Reset Filters</Button>
                        </div>
                    </div>
                 </div>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">Payroll Details ({filteredData.length} entries)</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-[#0D0D12]">
                            <tr>
                                <th scope="col" className="px-6 py-3">Employee</th>
                                <th scope="col" className="px-6 py-3">Period</th>
                                <th scope="col" className="px-6 py-3 text-right">Gross Pay</th>
                                <th scope="col" className="px-6 py-3 text-right">Deductions</th>
                                <th scope="col" className="px-6 py-3 text-right">Net Pay</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#2D2D3A]">
                                        <td colSpan={7} className="p-4"><div className="h-8 bg-gray-700 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : filteredData.map(item => (
                                <tr key={item.id} className="border-b border-[#2D2D3A] hover:bg-[#0D0D12]">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{item.employee?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{item.employee?.position}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.periodStart)} - {formatDate(item.periodEnd)}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrencyPHP(item.grossPay)}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrencyPHP(item.grossPay - item.netPay)}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-white">{formatCurrencyPHP(item.netPay)}</td>
                                    <td className="px-6 py-4"><StatusPill status={item.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                         <div className="relative inline-block">
                                            <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="text-gray-400 hover:text-white">
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {activeMenu === item.id && (
                                                <div className="absolute right-0 mt-2 w-40 bg-[#2D2D3A] border border-[#4a4a5a] rounded-md shadow-lg z-10 text-left">
                                                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c4a]">View Payslip</a>
                                                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c4a]">Export PDF</a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {!isLoading && filteredData.length === 0 && <div className="text-center p-4">No payroll entries found.</div>}
                </div>
            </Card>

            <Modal 
                isOpen={isRunPayrollModalOpen} 
                onClose={() => setIsRunPayrollModalOpen(false)} 
                title="Run New Payroll"
                size="xl"
            >
                <RunPayrollForm 
                    employees={employees}
                    onCancel={() => setIsRunPayrollModalOpen(false)}
                    onSubmit={handleRunPayrollSubmit}
                />
            </Modal>
        </div>
    );
};

export default Payroll;
