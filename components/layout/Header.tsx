

import React from 'react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navItems = [
    { to: '/home', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/data', label: 'Data Management' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/funds', label: 'Funds' },
    { to: '/timesheets', label: 'Timesheets' },
    { to: '/payroll', label: 'Payroll' },
    { to: '/employees', label: 'Employees' },
    { to: '/tasks', label: 'Tasks' },
    { to: '/vendors', label: 'Vendors' },
    { to: '/reports', label: 'Reports' },
];

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const location = useLocation();

    const getPageTitle = () => {
        const currentPath = location.pathname;
        if (currentPath === '/') return 'Home';
        const currentNavItem = navItems.find(item => currentPath.startsWith(item.to));
        return currentNavItem ? currentNavItem.label : 'HaloBloc';
    };

    return (
        <header className="md:hidden sticky top-0 z-30 bg-[#14141B]/80 backdrop-blur-lg border-b border-[#2D2D3A] px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
                {/* Header: Left side */}
                <div className="flex items-center space-x-2">
                     <h1 className="text-lg font-semibold text-white tracking-wide">{getPageTitle()}</h1>
                </div>

                {/* Header: Right side */}
                <div className="flex items-center">
                    <button
                        className="text-gray-400 hover:text-white p-2 -mr-2"
                        aria-controls="sidebar"
                        aria-expanded={sidebarOpen}
                        onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="5" width="16" height="2" rx="1" />
                            <rect x="4" y="11" width="16" height="2" rx="1" />
                            <rect x="4" y="17" width="16" height="2" rx="1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;