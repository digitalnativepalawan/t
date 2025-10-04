import React, { useState, useEffect, useMemo, useRef } from 'react';
import Button from '../components/ui/Button';
import { getTasks, addTaskComment, addTaskAttachment, addTask, updateTask, deleteTask, deleteTaskAttachment, updateTaskComment, deleteTaskComment } from '../services/mockApi';
import { Task, TaskStatus, TaskPriority } from '../types';
import { PlusIcon, UserCircleIcon, CalendarIcon, FlagIcon, ClipboardListIcon, CogIcon, CheckCircleIcon, ChatBubbleLeftIcon, PaperClipIcon, PhotoIcon, PencilIcon, TrashIcon } from '../components/Icons';
import { formatDate, formatTimeAgo } from '../utils/formatters';
import Modal from '../components/ui/Modal';

const assigneeMap: { [key: string]: string } = {
    'staff-1': 'David Le',
    'manager-1': 'Quennie O',
    'admin': 'Admin User',
};

const statusConfig = {
    [TaskStatus.TODO]: { title: 'To Do', color: 'text-gray-400', icon: ClipboardListIcon },
    [TaskStatus.IN_PROGRESS]: { title: 'In Progress', color: 'text-blue-400', icon: CogIcon },
    [TaskStatus.COMPLETED]: { title: 'Completed', color: 'text-green-400', icon: CheckCircleIcon },
};

const priorityConfig = {
    [TaskPriority.LOW]: { label: 'Low', color: 'text-gray-400' },
    [TaskPriority.MEDIUM]: { label: 'Medium', color: 'text-yellow-400' },
    [TaskPriority.HIGH]: { label: 'High', color: 'text-red-400' },
};

const NewTaskForm: React.FC<{
    onClose: () => void;
    onTaskAdded: (newTask: Task) => void;
}> = ({ onClose, onTaskAdded }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignee, setAssignee] = useState('staff-1');
    const [priority, setPriority] = useState(TaskPriority.MEDIUM);
    const [dueDate, setDueDate] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [urlInput, setUrlInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addToCalendar, setAddToCalendar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Simulate upload and get a URL.
            // In a real app, this would upload to a server.
            const fakeUrl = `https://picsum.photos/seed/${Math.random()}/200/300`; // Using picsum for placeholder
            setAttachments(prev => [...prev, fakeUrl]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddUrl = () => {
        if (urlInput.trim()) {
            setAttachments(prev => [...prev, urlInput.trim()]);
            setUrlInput('');
        }
    };

    const handleRemoveAttachment = (urlToRemove: string) => {
        setAttachments(prev => prev.filter(url => url !== urlToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const newTaskData = {
                title,
                description,
                assignee,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                attachments: attachments.length > 0 ? attachments : undefined,
                comments: [],
            };
            // The status, createdBy, etc., will be set by the API
            const newTask = await addTask(newTaskData); 
            onTaskAdded(newTask);
            onClose();
        } catch (error) {
            console.error("Failed to add task:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required autoFocus />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Description (optional)</label>
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
            
            <div className="flex items-center">
                <input
                    id="addToCalendar"
                    type="checkbox"
                    checked={addToCalendar}
                    onChange={(e) => {
                        const isChecked = e.target.checked;
                        setAddToCalendar(isChecked);
                        if (!isChecked) {
                            setDueDate('');
                        }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-[#8A5CF6] focus:ring-[#8A5CF6] bg-[#0D0D12]"
                />
                <label htmlFor="addToCalendar" className="ml-2 text-sm text-gray-300">
                    Add to Company Calendar
                </label>
            </div>
            
            {addToCalendar && (
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                    <input 
                        type="date" 
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)} 
                        className={inputClasses} 
                        required 
                    />
                </div>
            )}

            <div>
                <label className="text-xs text-gray-400 mb-1 block">Attachments</label>
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input type="url" placeholder="Paste image URL (e.g., from Google)" value={urlInput} onChange={e => setUrlInput(e.target.value)} className={inputClasses} />
                        <Button type="button" variant="secondary" onClick={handleAddUrl} disabled={!urlInput.trim()}>Add URL</Button>
                        <Button type="button" variant="secondary" leftIcon={<PhotoIcon/>} onClick={() => fileInputRef.current?.click()}>Upload</Button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    </div>
                    {attachments.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-[#0D0D12] p-2 rounded-lg">
                            <div className="flex items-center gap-2 truncate">
                                <img src={url} alt="attachment preview" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                                <span className="text-sm text-blue-400 truncate">{url}</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveAttachment(url)} className="text-gray-400 hover:text-white text-lg">&times;</button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting || !title.trim()}>
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
            </div>
        </form>
    );
};

const TaskDetailModal: React.FC<{
    task: Task | null;
    onClose: () => void;
    onUpdate: (updatedTask: Task) => void;
    onDelete: (taskId: string) => void;
}> = ({ task, onClose, onUpdate, onDelete }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<Partial<Task>>({});
    const [editingComment, setEditingComment] = useState<{ index: number; text: string } | null>(null);

    useEffect(() => {
        if (isEditing && task) {
            setEditedData({
                title: task.title,
                description: task.description || '',
                assignee: task.assignee,
                priority: task.priority,
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            });
        }
    }, [isEditing, task]);

    if (!task) return null;
    
    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmittingComment) return;
        setIsSubmittingComment(true);
        try {
            const updatedTask = await addTaskComment(task.id, newComment, 'admin');
            onUpdate(updatedTask);
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };
    
    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!attachmentUrl.trim()) return;
        try {
            const updatedTask = await addTaskAttachment(task.id, attachmentUrl);
            onUpdate(updatedTask);
            setAttachmentUrl('');
        } catch (error) { 
            console.error('Failed to add link attachment:', error);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const fakeUrl = `local-file/${file.name}`; 
            const updatedTask = await addTaskAttachment(task.id, fakeUrl);
            onUpdate(updatedTask);
            if(fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) { 
             console.error('Failed to add file attachment:', error);
        }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!editedData.title?.trim()) {
            alert('Title cannot be empty.');
            return;
        }
        try {
            const updatedTask = await updateTask(task.id, {
                ...editedData,
                dueDate: editedData.dueDate ? new Date(editedData.dueDate).toISOString() : undefined,
            });
            onUpdate(updatedTask);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update task:', error);
            alert('Could not save changes.');
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            onDelete(task.id);
        }
    };

    const handleAttachmentDelete = async (url: string) => {
        if (!task) return;
        if (window.confirm('Are you sure you want to delete this attachment?')) {
            try {
                const updatedTask = await deleteTaskAttachment(task.id, url);
                onUpdate(updatedTask);
            } catch (error) {
                console.error('Failed to delete attachment', error);
                alert('Could not delete attachment.');
            }
        }
    };

    const handleCommentDelete = async (originalIndex: number) => {
        if (!task) return;
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                const updatedTask = await deleteTaskComment(task.id, originalIndex);
                onUpdate(updatedTask);
            } catch (error) {
                console.error('Failed to delete comment', error);
                alert('Could not delete comment.');
            }
        }
    };

    const handleCommentUpdate = async () => {
        if (!task || !editingComment) return;
        try {
            const updatedTask = await updateTaskComment(task.id, editingComment.index, editingComment.text);
            onUpdate(updatedTask);
            setEditingComment(null);
        } catch (error) {
            console.error('Failed to update comment', error);
            alert('Could not update comment.');
        }
    };
    
    const priority = priorityConfig[task.priority];
    const assigneeName = assigneeMap[task.assignee] || task.assignee;
    const inputClasses = "bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none";

    return (
        <Modal isOpen={!!task} onClose={onClose} title={isEditing ? 'Edit Project' : task.title} size="lg">
            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Title</label>
                        <input type="text" name="title" value={editedData.title} onChange={handleEditChange} className={inputClasses} required autoFocus />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Description</label>
                        <textarea name="description" value={editedData.description} onChange={handleEditChange} rows={3} className={inputClasses} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Assignee</label>
                            <select name="assignee" value={editedData.assignee} onChange={handleEditChange} className={inputClasses}>
                                {Object.entries(assigneeMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                            <select name="priority" value={editedData.priority} onChange={handleEditChange} className={inputClasses}>
                                {Object.entries(priorityConfig).map(([level, {label}]) => <option key={level} value={level}>{label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                        <input type="date" name="dueDate" value={editedData.dueDate} onChange={handleEditChange} className={inputClasses} />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                     <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-300" title="Assignee">
                            <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                            <span>{assigneeName}</span>
                        </div>
                        {task.dueDate && (
                            <div className="flex items-center text-gray-300" title="Due Date">
                                <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                                <span>{formatDate(task.dueDate)}</span>
                            </div>
                        )}
                        <div className={`flex items-center font-medium ${priority.color}`} title="Priority">
                            <FlagIcon className="h-5 w-5 mr-2" />
                            <span>{priority.label}</span>
                        </div>
                    </div>

                    {task.description && (
                        <div>
                            <h4 className="font-semibold text-white mb-2">Description</h4>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{task.description}</p>
                        </div>
                    )}
                     
                     <div>
                        <h4 className="font-semibold text-white mb-3">Attachments</h4>
                        <div className="space-y-2">
                            {task.attachments?.map((att, index) => (
                                <div key={index} className="flex items-center justify-between bg-[#0D0D12] p-2 rounded-lg">
                                    <a href={att} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate flex-1">
                                        <PaperClipIcon className="h-5 w-5 mr-1 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-blue-400 truncate">{att.startsWith('local-file/') ? att.substring(11) : att}</span>
                                    </a>
                                    <button onClick={() => handleAttachmentDelete(att)} className="p-1 text-gray-500 hover:text-red-400 ml-2">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddLink} className="mt-4 flex gap-2 items-center">
                            <input type="url" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="Add a link..." className="flex-grow bg-[#0D0D12] border border-[#2D2D3A] rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none" />
                            <Button type="submit" variant="secondary" disabled={!attachmentUrl.trim()}>Add Link</Button>
                            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Upload</Button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                        </form>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-3 pt-4 border-t border-[#2D2D3A]">Comments</h4>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.slice().reverse().map((comment, index) => {
                                    const originalIndex = task.comments!.length - 1 - index;
                                    const isEditingThisComment = editingComment?.index === originalIndex;
                                    
                                    return (
                                        <div key={originalIndex} className="flex items-start space-x-3">
                                            <UserCircleIcon className="h-8 w-8 text-gray-500 flex-shrink-0 mt-1" />
                                            <div className="flex-1">
                                                <div className="flex items-baseline justify-between">
                                                    <div className="flex items-baseline space-x-2">
                                                        <p className="font-semibold text-white text-sm">{assigneeMap[comment.userId] || comment.userId}</p>
                                                        <p className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</p>
                                                    </div>
                                                    {comment.userId === 'admin' && !isEditingThisComment && (
                                                        <div className="flex items-center space-x-2">
                                                            <button onClick={() => setEditingComment({ index: originalIndex, text: comment.text })} className="p-1 text-gray-500 hover:text-white">
                                                                <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => handleCommentDelete(originalIndex)} className="p-1 text-gray-500 hover:text-red-400">
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {isEditingThisComment ? (
                                                     <div className="mt-1">
                                                        <textarea
                                                            value={editingComment.text}
                                                            onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                                            rows={3}
                                                            className="w-full bg-[#0D0D12] border border-[#2D2D3A] rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none transition"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end space-x-2 mt-2">
                                                            <Button size="sm" variant="secondary" onClick={() => setEditingComment(null)}>Cancel</Button>
                                                            <Button size="sm" variant="primary" onClick={handleCommentUpdate}>Save</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-300 bg-[#0D0D12] p-2 rounded-lg mt-1 whitespace-pre-wrap">{comment.text}</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-sm text-gray-400 italic">No comments yet.</p>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleCommentSubmit} className="pt-4 border-t border-[#2D2D3A]">
                        <div className="flex items-start space-x-3">
                            <UserCircleIcon className="h-8 w-8 text-gray-500 flex-shrink-0" />
                            <div className="flex-1">
                                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." rows={2} className="w-full bg-[#0D0D12] border border-[#2D2D3A] rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#8A5CF6] focus:border-[#8A5CF6] outline-none transition" />
                                <div className="mt-2 flex justify-between items-center">
                                    <Button type="button" variant="subtle" className="text-red-400 hover:bg-red-500/10" onClick={handleDelete}>Delete Project</Button>
                                    <div>
                                        <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit</Button>
                                        <Button type="submit" variant="primary" disabled={!newComment.trim() || isSubmittingComment} className="ml-2">
                                            {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </Modal>
    );
};

const TaskCard: React.FC<{ task: Task; onClick: (task: Task) => void; }> = ({ task, onClick }) => {
    const assigneeName = assigneeMap[task.assignee] || task.assignee;
    const priority = priorityConfig[task.priority];
    
    return (
        <div onClick={() => onClick(task)} className="bg-[#1A1A23] border border-[#2D2D3A] p-4 rounded-lg shadow-md cursor-pointer hover:bg-[#2D2D3A] transition-colors duration-200">
            <p className="font-semibold text-white text-sm mb-2">{task.title}</p>
            {task.description && <p className="text-xs text-gray-400 mt-2 mb-3 line-clamp-2">{task.description}</p>}
            <div className="flex justify-between items-center mt-4">
                 <div className="flex items-center space-x-4 text-xs text-gray-400">
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center" title="Attachments">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span>{task.attachments.length}</span>
                        </div>
                    )}
                    {task.comments && task.comments.length > 0 && (
                        <div className="flex items-center" title="Comments">
                            <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                            <span>{task.comments.length}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center text-xs text-gray-400" title={`Assignee: ${assigneeName}`}>
                        <UserCircleIcon className="h-5 w-5" />
                    </div>
                    <div className={`flex items-center text-xs font-medium ${priority.color}`} title={`Priority: ${priority.label}`}>
                        <FlagIcon className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ status: TaskStatus; tasks: Task[]; onTaskClick: (task: Task) => void }> = ({ status, tasks, onTaskClick }) => {
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <div className="bg-[#14141B] rounded-lg p-3 w-full md:w-80 flex-shrink-0 flex flex-col">
            <div className="flex justify-between items-center mb-4 px-1">
                <div className={`flex items-center font-semibold ${config.color}`}>
                    <StatusIcon className="h-5 w-5 mr-2" />
                    <h3 className="text-white">{config.title}</h3>
                </div>
                <span className="text-sm text-gray-400 bg-[#0D0D12] px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {tasks.map(task => <TaskCard key={task.id} task={task} onClick={onTaskClick} />)}
            </div>
        </div>
    );
};

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getTasks();
            setTasks(data);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const tasksByStatus = useMemo(() => {
        return tasks.reduce((acc, task) => {
            if (!acc[task.status]) {
                acc[task.status] = [];
            }
            acc[task.status].push(task);
            return acc;
        }, {} as Record<TaskStatus, Task[]>);
    }, [tasks]);
    
    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
    };

    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
        }
    };
    
    const handleTaskAdded = (newTask: Task) => {
        setTasks(prev => [newTask, ...prev]);
    };

    const handleTaskDeleted = async (taskId: string) => {
        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setSelectedTask(null);
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-white">Projects Board</h1>
                    <p className="text-gray-400 mt-1">Organize, assign, and track your team's projects.</p>
                </div>
                <Button variant="primary" leftIcon={<PlusIcon />} onClick={() => setIsNewTaskModalOpen(true)}>New Project</Button>
            </div>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">Loading projects...</div>
            ) : (
                <div className="flex-1 flex flex-col md:flex-row gap-6 md:overflow-x-auto pb-4">
                    {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED].map(status => (
                        <KanbanColumn key={status} status={status} tasks={tasksByStatus[status] || []} onTaskClick={handleTaskClick} />
                    ))}
                </div>
            )}
             <TaskDetailModal
                task={selectedTask}
                onClose={handleCloseModal}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDeleted}
            />
            <Modal
                isOpen={isNewTaskModalOpen}
                onClose={() => setIsNewTaskModalOpen(false)}
                title="Create New Project"
                size="lg"
            >
                <NewTaskForm
                    onClose={() => setIsNewTaskModalOpen(false)}
                    onTaskAdded={handleTaskAdded}
                />
            </Modal>
        </div>
    );
};

export default Tasks;