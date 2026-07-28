import useRecentReceipts from '../../hooks/useRecentReceipts';
import WidgetState, { SkeletonRows } from './WidgetState';
import { timeAgo } from '../../api/timeAgo';

const STATUS_STYLES = {
    paid: 'bg-green-50 text-green-600',
    unpaid: 'bg-orange-50 text-orange-600',
    voided: 'bg-stone-100 text-stone-500',
};

const METHOD_LABELS = {
    cash: '💵 Cash',
    mpesa_till: '📱 Till',
    mpesa_paybill: '🏢 Paybill',
    mpesa_pochi: '👛 Pochi',
};

export default function RecentTransactions() {
    const { receipts, loading, error, refetch } = useRecentReceipts(10);

    return (
        <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-4">Recent Transactions</h3>
            <WidgetState
                loading={loading}
                error={error}
                onRetry={refetch}
                empty={!loading && !error && receipts.length === 0}
                emptyMessage="No transactions yet today"
                skeleton={<SkeletonRows count={5} height="h-12" />}
            >
                <ul className="divide-y divide-orange-50">
                    {receipts.map((r) => (
                        <li key={r.id} className="py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-orange-600 text-sm">{r.receipt_number}</span>
                                    <span className="text-stone-400 text-xs">Table {r.table_number ?? '—'}</span>
                                </div>
                                <div className="text-xs text-stone-400 truncate">{r.waiter_name || 'Unassigned'}</div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-bold text-gray-900 text-sm">
                                    KES {Number(r.amount_paid ?? r.subtotal ?? 0).toFixed(2)}
                                </div>
                                <div className="text-xs text-stone-400">
                                    {METHOD_LABELS[r.payment_method] || (r.payment_method ?? '—')}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 w-24">
                                <span
                                    className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[r.status] || 'bg-stone-100 text-stone-500'}`}
                                >
                                    {r.status}
                                </span>
                                <span className="text-xs text-stone-400">{timeAgo(r.created_at)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </WidgetState>
        </div>
    );
}
