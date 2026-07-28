import useRecentOrders from '../../hooks/useRecentOrders';
import WidgetState, { SkeletonRows } from './WidgetState';
import { timeAgo } from '../../api/timeAgo';

const STATUS_STYLES = {
    pending: 'bg-orange-50 text-orange-600',
    preparing: 'bg-yellow-50 text-yellow-700',
    ready: 'bg-blue-50 text-blue-600',
    completed: 'bg-green-50 text-green-600',
    cancelled: 'bg-stone-100 text-stone-500',
};

export default function RecentOrders() {
    const { orders, loading, error, refetch } = useRecentOrders(10);

    return (
        <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-4">Recent Orders</h3>
            <WidgetState
                loading={loading}
                error={error}
                onRetry={refetch}
                empty={!loading && !error && orders.length === 0}
                emptyMessage="No orders yet today"
                skeleton={<SkeletonRows count={5} height="h-12" />}
            >
                <ul className="divide-y divide-orange-50">
                    {orders.map((o) => (
                        <li key={o.id} className="py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 text-sm">
                                    Table {o.table_number ?? '—'}
                                </div>
                                <div className="text-xs text-stone-400 truncate">{o.waiter_name || 'Unassigned'}</div>
                            </div>
                            <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLES[o.status] || 'bg-stone-100 text-stone-500'}`}
                            >
                                {o.status}
                            </span>
                            <span className="text-xs text-stone-400 shrink-0 w-14 text-right">
                                {timeAgo(o.created_at)}
                            </span>
                        </li>
                    ))}
                </ul>
            </WidgetState>
        </div>
    );
}
