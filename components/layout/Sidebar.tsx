


import React, { useRef, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, DashboardIcon, DataIcon, TransactionsIcon, FundsIcon, TimesheetsIcon, TasksIcon, VendorsIcon, ReportsIcon, LogoutIcon, PayrollIcon, EmployeesIcon, InvoiceIcon } from '../Icons';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navItems = [
  { to: '/tasks', icon: TasksIcon, label: 'Projects' },
  { to: '/home', icon: HomeIcon, label: 'Home' },
  { to: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
  { to: '/data', icon: DataIcon, label: 'Data Management' },
  { to: '/transactions', icon: TransactionsIcon, label: 'Transactions' },
  { to: '/funds', icon: FundsIcon, label: 'Funds' },
  { to: '/timesheets', icon: TimesheetsIcon, label: 'Timesheets' },
  { to: '/payroll', icon: PayrollIcon, label: 'Payroll' },
  { to: '/invoices', icon: InvoiceIcon, label: 'Invoices' },
  { to: '/employees', icon: EmployeesIcon, label: 'Employees' },
  { to: '/vendors', icon: VendorsIcon, label: 'Vendors' },
  { to: '/reports', icon: ReportsIcon, label: 'Reports' },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const sidebar = useRef<HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !(target instanceof Node)) return;
      if (!sidebarOpen || sidebar.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [sidebarOpen, setSidebarOpen]);

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [sidebarOpen, setSidebarOpen]);


  const linkClasses = "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200";
  const inactiveClasses = "text-gray-400 hover:bg-[#1A1A23] hover:text-white";
  const activeClasses = "bg-[#8A5CF6]/10 text-[#A881FF]";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`;

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(currentTime);
  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(currentTime);

  return (
    <>
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside
        ref={sidebar}
        className={`flex flex-col w-64 bg-[#14141B] border-r border-[#1A1A23] absolute z-40 left-0 top-0 md:static md:left-auto md:top-auto md:translate-x-0 h-screen overflow-y-auto transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:flex`}
        aria-labelledby="sidebar-navigation"
      >
        <div className="flex flex-col items-center justify-center h-16 border-b border-[#1A1A23] flex-shrink-0 px-4 text-center">
          <p className="text-2xl font-bold text-white tracking-wider font-mono select-none">{formattedTime}</p>
          <p className="text-xs text-gray-400 select-none">{formattedDate}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <nav className="flex-1">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={getNavLinkClass} onClick={() => setSidebarOpen(false)}>
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-[#1A1A23] space-y-2">
          <a href="#" className={`${linkClasses} ${inactiveClasses} text-red-400 hover:bg-red-500/10`}>
            <LogoutIcon className="h-5 w-5 mr-3" />
            Logout
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;