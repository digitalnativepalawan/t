import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { FundsIcon, ReportsIcon, TransactionsIcon, TasksIcon, VendorsIcon, EmployeesIcon, PayrollIcon, DataIcon, FlagIcon, PlusIcon } from '../components/Icons';
import { getTasks, addTask, updateTask, deleteTask } from '../services/mockApi';
import { Task, TaskPriority, TaskStatus } from '../types';

const quickActions = [
    { title: 'Add Transaction', to: '/transactions', icon: TransactionsIcon, color: 'text-green-400' },
    { title: 'Create Project', to: '/tasks', icon: TasksIcon, color: 'text-yellow-400' },
    { title: 'Manage Funds', to: '/funds', icon: FundsIcon, color: 'text-purple-400' },
    { title: 'View Reports', to: '/reports', icon: ReportsIcon, color: 'text-blue-400' },
    { title: 'Manage Employees', to: '/employees', icon: EmployeesIcon, color: 'text-pink-400' },
    { title: 'Manage Vendors', to: '/vendors', icon: VendorsIcon, color: 'text-indigo-400' },
    { title: 'Run Payroll', to: '/payroll', icon: PayrollIcon, color: 'text-teal-400' },
    { title: 'Upload Data', to: '/data', icon: DataIcon, color: 'text-orange-400' }
];

const featureCards = [
    { title: 'Financial Analytics', description: 'Track revenue, expenses, and profitability with real-time insights and detailed reporting.', icon: ReportsIcon },
    { title: 'Secure Operations', description: 'Enterprise-grade security with role-based access controls and data encryption.', icon: VendorsIcon },
    { title: 'Automated Workflows', description: 'Streamline operations with automated project management and timesheet tracking.', icon: TasksIcon }
];

const statusConfigForForm: { [key in TaskStatus]: { title: string } } = {
    [TaskStatus.TODO]: { title: 'To Do' },
    [TaskStatus.IN_PROGRESS]: { title: 'In Progress' },
    [TaskStatus.COMPLETED]: { title: 'Completed' },
};


// --- Calendar Sub-components ---

const assigneeMap: { [key: string]: string } = {
    'staff-1': 'David Le',
    'manager-1': 'Quennie O',
    'admin': 'Admin User',
};
const priorityConfig: { [key in TaskPriority]: { label: string, color: string } } = {
    [TaskPriority.LOW]: { label: 'Low', color: 'bg-gray-500/10 text-gray-400' },
    [TaskPriority.MEDIUM]: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-400' },
    [TaskPriority.HIGH]: { label: 'High', color: 'bg-red-500/10 text-red-400' },
};

const TaskForm: React.FC<{
    task?: Task | null;
    day: Date;
    onSave: (taskData: Partial<Task>) => Promise<void>;
    onDelete?: (taskId: string) => Promise<void>;
    onCancel: () => void;
}> = ({ task, day, onSave, onDelete, onCancel }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [assignee, setAssignee] = useState(task?.assignee || 'staff-1');
    const [priority, setPriority] = useState(task?.priority || TaskPriority.MEDIUM);
    const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : day.toISOString().split('T')[0]);
    const [status, setStatus] = useState(task?.status || TaskStatus.TODO);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSaving(true);
        const taskData = {
            id: task?.id,
            title,
            description,
            assignee,
            priority,
            dueDate: new Date(dueDate).toISOString(),
            status: status
        };
        await onSave(taskData);
        setIsSaving(false);
    };

    const handleDelete = async () => {
      if(task && onDelete) {
        setIsSaving(true);
        await onDelete(task.id);
        setIsSaving(false);
      }
    }
    
    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required autoFocus />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Assignee</label>
                    <select value={assignee} onChange={e => setAssignee(e.target.value)} className={inputClasses}>
                        {Object.entries(assigneeMap).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={inputClasses}>
                        {Object.entries(priorityConfig).map(([level, {label}]) => (
                            <option key={level} value={level}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className={inputClasses}>
                        {Object.entries(statusConfigForForm).map(([s, { title }]) => (
                            <option key={s} value={s}>{title}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-between items-center pt-4">
                <div>
                    {task && onDelete && (
                        <Button type="button" variant="subtle" className="text-red-400 hover:bg-red-500/10" onClick={handleDelete} disabled={isSaving}>
                            Delete
                        </Button>
                    )}
                </div>
                <div className="flex space-x-2">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving || !title.trim()}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </form>
    );
};


const Home: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [editingTask, setEditingTask] = useState<Task | 'new' | null>(null);

    const fetchAllTasks = async () => {
        const tasksData = await getTasks();
        setTasks(tasksData);
    };

    useEffect(() => {
        fetchAllTasks();
    }, []);

    const tasksByDate = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        tasks.forEach(task => {
            if (task.dueDate) {
                const dateKey = new Date(task.dueDate).toDateString();
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    
    const handleDayClick = (day: number) => {
        setSelectedDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const handleCloseModal = () => {
        setSelectedDay(null);
        setEditingTask(null);
    };

    const handleSaveTask = async (taskData: Partial<Task>) => {
        if (taskData.id) {
            await updateTask(taskData.id, taskData);
        } else {
            await addTask(taskData as any);
        }
        await fetchAllTasks();
        handleCloseModal();
    };

    const handleDeleteTask = async (taskId: string) => {
        await deleteTask(taskId);
        await fetchAllTasks();
        handleCloseModal();
    };

    const Calendar = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const todayKey = today.toDateString();

        const calendarDays = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-[#2D2D3A]"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toDateString();
            const dayTasks = tasksByDate[dateKey] || [];
            const isToday = dateKey === todayKey;

            calendarDays.push(
                <div key={day} onClick={() => handleDayClick(day)} className="relative p-2 border-r border-b border-[#2D2D3A] min-h-[120px] cursor-pointer hover:bg-[#2D2D3A] transition-colors duration-200 flex flex-col">
                    <span className={`text-sm ${isToday ? 'bg-[#8A5CF6] text-white rounded-full h-6 w-6 flex items-center justify-center font-bold' : 'text-gray-300'}`}>{day}</span>
                    <div className="mt-2 space-y-1 overflow-y-auto">
                        {dayTasks.slice(0, 3).map(task => (
                            <div key={task.id} className={`text-xs p-1 rounded-md truncate ${priorityConfig[task.priority].color}`}>
                                {task.title}
                            </div>
                        ))}
                        {dayTasks.length > 3 && <div className="text-xs text-gray-400 mt-1">+{dayTasks.length - 3} more</div>}
                    </div>
                </div>
            );
        }
        return calendarDays;
    }, [currentDate, tasksByDate]);

    return (
        <div className="space-y-16">
            <section className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Quick Actions</h2>
                <p className="text-gray-400 max-w-xl mx-auto mb-8">Access key features with a single click</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {quickActions.map(action => (
                        <Link to={action.to} key={action.title} className="block">
                            <Card className="flex flex-col items-center justify-center p-6 h-full hover:bg-[#2D2D3A] transition-all duration-200">
                                <action.icon className={`h-8 w-8 mb-3 ${action.color}`} />
                                <span className="font-semibold text-white text-center">{action.title}</span>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

             <section className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Key Features</h2>
                <p className="text-gray-400 max-w-2xl mx-auto mb-8">Our platform provides all the tools you need to manage finances, staff, tasks, and vendor relationships efficiently.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featureCards.map(feature => (
                        <Card key={feature.title} className="text-center p-8">
                            <div className="inline-block p-4 bg-[#8A5CF6]/10 rounded-lg mb-4">
                                <feature.icon className="h-8 w-8 text-[#A881FF]" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-400">{feature.description}</p>
                        </Card>
                    ))}
                </div>
            </section>
            
            <section>
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Company Calendar</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                        Stay updated with company-wide events, deadlines, and holidays.
                    </p>
                </div>
                <Card className="p-4">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-xl font-semibold text-white">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex space-x-2">
                            <Button variant="secondary" onClick={handlePrevMonth}>&lt;</Button>
                            <Button variant="secondary" onClick={handleNextMonth}>&gt;</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-semibold border-t border-l border-[#2D2D3A]">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} className="py-2 border-r border-b border-[#2D2D3A]">{day}</div>
                        ))}
                        {Calendar}
                    </div>
                </Card>
            </section>

            {selectedDay && (
                <Modal 
                    isOpen={!!selectedDay} 
                    onClose={handleCloseModal} 
                    title={editingTask ? (editingTask === 'new' ? 'New Event' : 'Edit Event') : selectedDay.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    size="lg"
                >
                    {editingTask ? (
                        <TaskForm 
                            task={editingTask === 'new' ? null : editingTask}
                            day={selectedDay}
                            onSave={handleSaveTask}
                            onDelete={handleDeleteTask}
                            onCancel={() => setEditingTask(null)}
                        />
                    ) : (
                        <div>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {(tasksByDate[selectedDay.toDateString()] || []).length > 0 ? (
                                    (tasksByDate[selectedDay.toDateString()] || []).map(task => (
                                        <div key={task.id} onClick={() => setEditingTask(task)} className="p-3 bg-[#0D0D12] rounded-lg cursor-pointer hover:bg-[#2D2D3A] transition-colors">
                                            <p className="font-semibold text-white">{task.title}</p>
                                            <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>
                                            <div className="flex items-center text-xs text-gray-500 mt-2">
                                                <FlagIcon className={`h-4 w-4 mr-1 ${priorityConfig[task.priority].color.split(' ')[1]}`} />
                                                <span>{priorityConfig[task.priority].label} priority</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-4">No events scheduled for this day.</p>
                                )}
                            </div>
                            <div className="mt-6 text-right">
                                <Button variant="primary" leftIcon={<PlusIcon/>} onClick={() => setEditingTask('new')}>Add New Event</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default Home;