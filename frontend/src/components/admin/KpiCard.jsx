import DashboardCard from './DashboardCard';
import WidgetState, { SkeletonCards } from './WidgetState';
import useDashboardKpis from '../../hooks/useDashboardKpis';

export default function KpiCards() {
    const { kpis, loading, error, refetch } = useDashboardKpis();

    return (
        <WidgetState
            loading={loading}
            error={error}
            onRetry={refetch}
            skeleton={<SkeletonCards count={6} />}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <DashboardCard
                    icon="💵"
                    label="Today's Revenue"
                    value={`KES ${Number(kpis?.total_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <DashboardCard icon="🧾" label="Orders Today" value={kpis?.orders_today ?? 0} />
                <DashboardCard icon="🍽️" label="Active Tables" value={kpis?.active_tables ?? 0} />
                <DashboardCard icon="🔥" label="Kitchen Queue" value={kpis?.kitchen_queue ?? 0} />
                <DashboardCard icon="✅" label="Paid Receipts Today" value={kpis?.paid_receipts_today ?? 0} />
                <DashboardCard icon="⏳" label="Unpaid Receipts" value={kpis?.unpaid_receipts ?? 0} />
            </div>
        </WidgetState>
    );
}
