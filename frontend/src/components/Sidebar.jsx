const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'orders', label: 'Orders', icon: '🧾' },
    { key: 'menu', label: 'Menu', icon: '🍽️' },
    { key: 'inventory', label: 'Inventory', icon: '📦' },
    { key: 'kitchen', label: 'Kitchen', icon: '🔥' },
    { key: 'waiters', label: 'Waiters', icon: '🧑‍🍳' },
    { key: 'cashiers', label: 'Cashiers', icon: '💳' },
    { key: 'customers', label: 'Customers', icon: '👥' },
    { key: 'reports', label: 'Reports', icon: '📈' },
    { key: 'shifts', label: 'Shifts', icon: '⏱️' },
    { key: 'payments', label: 'Payments', icon: '💰' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, active, onNavigate }) {
    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={onCloseMobile}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full bg-white border-r border-orange-200 z-50
                    transition-all duration-300 flex flex-col
                    ${collapsed ? 'lg:w-20' : 'lg:w-64'}
                    w-64
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Brand */}
                <div className="flex items-center gap-2 px-5 h-16 border-b border-orange-100 shrink-0">
                    <span className="text-xl">🍴</span>
                    {!collapsed && (
                        <span className="font-black text-lg text-gray-900 whitespace-nowrap">
                            Resto<span className="text-orange-500">POS</span>
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = active === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => {
                                    onNavigate(item.key);
                                    onCloseMobile();
                                }}
                                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors
                                    ${
                                        isActive
                                            ? 'bg-orange-50 text-orange-600'
                                            : 'text-stone-500 hover:bg-orange-50/60 hover:text-gray-900'
                                    }`}
                            >
                                <span
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-orange-500 transition-all duration-200
                                        ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}
                                />
                                <span className="text-lg shrink-0">{item.icon}</span>
                                {!collapsed && (
                                    <span className="whitespace-nowrap">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
