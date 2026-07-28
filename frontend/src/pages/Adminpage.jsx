import { useState } from 'react';
import Sidebar from '../components/admin/Sidebar';
import TopNavbar from '../components/admin/TopNavbar';
import KpiCards from '../components/admin/KpiCards';
import RecentTransactions from '../components/admin/RecentTransactions';
import RecentOrders from '../components/admin/RecentOrders';
import RecentActivity from '../components/admin/RecentActivity';
import QuickActions from '../components/admin/QuickActions';

const SECTION_LABELS = {
    dashboard: 'Dashboard',
    orders: 'Orders',
    menu: 'Menu',
    inventory: 'Inventory',
    kitchen: 'Kitchen',
    waiters: 'Waiters',
    cashiers: 'Cashiers',
    customers: 'Customers',
    reports: 'Reports',
    shifts: 'Shifts',
    payments: 'Payments',
    settings: 'Settings',
};

export default function AdminDashboard() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [active, setActive] = useState('dashboard');

    return (
        <div className="min-h-screen bg-orange-50/40">
            <Sidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
                active={active}
                onNavigate={setActive}
            />

            <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                <TopNavbar
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed((c) => !c)}
                    onOpenMobile={() => setMobileOpen(true)}
                />

                <main className="px-4 sm:px-6 lg:px-8 py-6">
                    {active === 'dashboard' ? (
                        <DashboardSection />
                    ) : (
                        <ComingSoonSection label={SECTION_LABELS[active]} />
                    )}
                </main>
            </div>
        </div>
    );
}

function DashboardSection() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
                <p className="text-stone-500 text-sm mt-1">Live view of today's restaurant activity.</p>
            </div>

            <KpiCards />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <RecentTransactions />
                <RecentOrders />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RecentActivity />
                </div>
                <div>
                    <QuickActions />
                </div>
            </div>
        </div>
    );
}

function ComingSoonSection({ label }) {
    return (
        <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-4">🚧</div>
            <h2 className="text-xl font-black text-gray-900 mb-1">{label}</h2>
            <p className="text-stone-500 text-sm">This section isn't built yet — it's on the way in a future phase.</p>
        </div>
    );
}
