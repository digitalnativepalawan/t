

import React, { useState, useEffect, useMemo } from 'react';
import KpiCard from '../components/ui/KpiCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '../services/mockApi';
import { Employee, Deductions } from '../types';
import { formatCurrencyPHP, formatDate } from '../utils/formatters';
import { PlusIcon, EllipsisVerticalIcon } from '../components/Icons';
import Modal from '../components/ui/Modal';

type FormValues = Omit<Employee, 'id'>;

// Employee Form Component
const EmployeeForm: React.FC<{
    onSubmit: (values: FormValues) => void;
    onCancel: () => void;
    initialData?: Employee | null;
}> = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState<FormValues>({
        name: initialData?.name || '',
        position: initialData?.position || '',
        rate: initialData?.rate || 0,
        deductions: initialData?.deductions || { sss: 0, philhealth: 0, pagibig: 0, tax: 0 },
        hireDate: initialData?.hireDate || new Date().toISOString(),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'rate' ? (parseFloat(value) || 0) : value }));
    };

    const handleDeductionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            deductions: {
                ...prev.deductions,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData, hireDate: new Date(formData.hireDate).toISOString() };
        onSubmit(finalData);
    };

    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required />
                </div>
                 <div>
                    <label className="text-xs text-gray-400 mb-1 block">Position</label>
                    <input type="text" name="position" value={formData.position} onChange={handleChange} className={inputClasses} required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Hourly Rate (PHP)</label>
                    <input type="number" step="0.01" name="rate" value={formData.rate} onChange={handleChange} className={inputClasses} required />
                </div>
                 <div>
                    <label className="text-xs text-gray-400 mb-1 block">Hire Date</label>
                    <input type="date" name="hireDate" value={formData.hireDate.split('T')[0]} onChange={handleChange} className={inputClasses} required />
                </div>
            </div>
            
            <fieldset className="border-t border-[#2D2D3A] pt-4">
                <legend className="text-sm font-semibold text-white mb-2">Default Deductions</legend>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div>
                        <label className="text-xs text-gray-400 mb-1 block">SSS</label>
                        <input type="number" step="0.01" name="sss" value={formData.deductions.sss} onChange={handleDeductionChange} className={inputClasses}/>
                    </div>
                     <div>
                        <label className="text-xs text-gray-400 mb-1 block">PhilHealth</label>
                        <input type="number" step="0.01" name="philhealth" value={formData.deductions.philhealth} onChange={handleDeductionChange} className={inputClasses}/>
                    </div>
                     <div>
                        <label className="text-xs text-gray-400 mb-1 block">Pag-IBIG</label>
                        <input type="number" step="0.01" name="pagibig" value={formData.deductions.pagibig} onChange={handleDeductionChange} className={inputClasses}/>
                    </div>
                     <div>
                        <label className="text-xs text-gray-400 mb-1 block">Tax</label>
                        <input type="number" step="0.01" name="tax" value={formData.deductions.tax} onChange={handleDeductionChange} className={inputClasses}/>
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">{initialData ? 'Update Employee' : 'Save Employee'}</Button>
            </div>
        </form>
    );
};


const Employees: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    
    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);
    
    const positions = useMemo(() => ['all', ...new Set(employees.map(e => e.position).sort())], [employees]);

    const filteredEmployees = useMemo(() => {
        return employees
            .filter(e => {
                if (dateRange.start && new Date(e.hireDate) < new Date(dateRange.start)) return false;
                if (dateRange.end) {
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(23, 59, 59, 999);
                    if (new Date(e.hireDate) > endDate) return false;
                }
                return true;
            })
            .filter(e => selectedPosition === 'all' || e.position === selectedPosition)
            .filter(e =>
                e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.position.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [employees, searchTerm, selectedPosition, dateRange]);


    const kpiData = useMemo(() => {
        const totalEmployees = employees.length;
        const totalDeductions = employees.reduce((sum, emp) => {
            return sum + emp.deductions.sss + emp.deductions.philhealth + emp.deductions.pagibig + emp.deductions.tax;
        }, 0);
        const totalHourlyRate = employees.reduce((sum, emp) => sum + emp.rate, 0);
        const averageHourlyRate = totalEmployees > 0 ? totalHourlyRate / totalEmployees : 0;
        return { totalEmployees, totalDeductions, averageHourlyRate };
    }, [employees]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedPosition('all');
        setDateRange({ start: '', end: '' });
    };

    const handleAddEmployee = () => {
        setEditingEmployee(null);
        setIsModalOpen(true);
    };

    const handleEditEmployee = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const handleDeleteEmployee = (employee: Employee) => {
        setDeletingEmployee(employee);
        setActiveMenu(null);
    };

    const confirmDelete = async () => {
        if (!deletingEmployee) return;
        try {
            await deleteEmployee(deletingEmployee.id);
            setEmployees(prev => prev.filter(emp => emp.id !== deletingEmployee.id));
        } catch (error) {
            console.error("Failed to delete employee:", error);
        } finally {
            setDeletingEmployee(null);
        }
    };

    const handleFormSubmit = async (values: FormValues) => {
        try {
            if (editingEmployee) {
                const updated = await updateEmployee(editingEmployee.id, values);
                setEmployees(prev => prev.map(emp => emp.id === updated.id ? updated : emp));
            } else {
                const newEmployee = await addEmployee(values);
                setEmployees(prev => [newEmployee, ...prev]);
            }
        } catch (error) {
            console.error("Failed to save employee:", error);
        } finally {
            setIsModalOpen(false);
            setEditingEmployee(null);
        }
    };
    
    const filterInputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-1.5 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Employee Management</h1>
                    <p className="text-gray-400 mt-1">Manage your team and their information.</p>
                </div>
                <Button variant="primary" leftIcon={<PlusIcon/>} onClick={handleAddEmployee}>Add Employee</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Employees" value={kpiData.totalEmployees} isLoading={isLoading} isCurrency={false} />
                <KpiCard title="Total Default Deductions" value={kpiData.totalDeductions} isLoading={isLoading} />
                <KpiCard title="Average Hourly Rate" value={kpiData.averageHourlyRate} isLoading={isLoading} />
            </div>

            <Card>
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Filter Employees</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Hire Date Range</label>
                            <div className="flex gap-2">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className={filterInputClasses} />
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className={filterInputClasses} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Position</label>
                            <select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} className={filterInputClasses}>
                               {positions.map(p => <option key={p} value={p}>{p === 'all' ? 'All Positions' : p}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="text-xs text-gray-400 mb-1 block">Search</label>
                             <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search by name or position..."
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
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Position</th>
                                <th scope="col" className="px-6 py-3">Hire Date</th>
                                <th scope="col" className="px-6 py-3 text-right">Hourly Rate</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Deductions</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#2D2D3A]">
                                        <td colSpan={6} className="p-4"><div className="h-8 bg-gray-700 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : filteredEmployees.map(emp => {
                                const totalDeductions = emp.deductions.sss + emp.deductions.philhealth + emp.deductions.pagibig + emp.deductions.tax;
                                return (
                                <tr key={emp.id} className="border-b border-[#2D2D3A] hover:bg-[#0D0D12]">
                                    <td className="px-6 py-4 font-medium text-white">{emp.name}</td>
                                    <td className="px-6 py-4">{emp.position}</td>
                                    <td className="px-6 py-4">{formatDate(emp.hireDate)}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrencyPHP(emp.rate)}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrencyPHP(totalDeductions)}</td>
                                    <td className="px-6 py-4 text-center">
                                         <div className="relative inline-block">
                                            <button onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)} className="text-gray-400 hover:text-white">
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {activeMenu === emp.id && (
                                                <div className="absolute right-0 mt-2 w-32 bg-[#2D2D3A] border border-[#4a4a5a] rounded-md shadow-lg z-10 text-left">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEditEmployee(emp); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3c3c4a]">Edit</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteEmployee(emp); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-[#3c3c4a]">Delete</a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {!isLoading && filteredEmployees.length === 0 && <div className="text-center p-4">No employees found. Add one to get started.</div>}
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? 'Edit Employee' : 'Add New Employee'} size="lg">
                <EmployeeForm 
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingEmployee}
                />
            </Modal>

            <Modal isOpen={!!deletingEmployee} onClose={() => setDeletingEmployee(null)} title="Delete Employee?">
                {deletingEmployee && (
                    <div>
                        <p className="text-gray-300">Are you sure you want to delete {deletingEmployee.name}? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button variant="secondary" onClick={() => setDeletingEmployee(null)}>Cancel</Button>
                            <Button variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={confirmDelete}>Delete</Button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default Employees;
