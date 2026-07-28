import { useCallback, useEffect, useRef, useState } from 'react';
import { getDashboardSummary, getTodayRevenue } from '../api/dashboardApi';
import { getSocket, connectSocket } from '../api/socket';

export default function useDashboardKpis() {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchingRef = useRef(false);
    const mountedRef = useRef(true);
    const debounceRef = useRef(null);

    const fetchKpis = useCallback(async () => {
        if (fetchingRef.current) return; // prevent overlapping duplicate requests
        fetchingRef.current = true;
        setError(null);
        try {
            // Independent resources — fetched in parallel, not sequentially
            const [summaryRes, revenueRes] = await Promise.all([
                getDashboardSummary(),
                getTodayRevenue(),
            ]);
            if (!mountedRef.current) return;
            setKpis({
                ...summaryRes.data,
                total_revenue: revenueRes.data.total_revenue,
                paid_receipts_today: revenueRes.data.paid_receipts_today,
            });
        } catch (err) {
            if (!mountedRef.current) return;
            console.error('Failed to load dashboard KPIs', err);
            setError('Could not load dashboard stats');
        } finally {
            if (mountedRef.current) setLoading(false);
            fetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        fetchKpis();
        return () => {
            mountedRef.current = false;
        };
    }, [fetchKpis]);

    // Live updates: these are cheap aggregate COUNT/SUM queries, so a
    // full re-fetch on the relevant events is simpler and safer than
    // trying to hand-patch counters client-side — just debounced so a
    // burst of events (e.g. an order created with several items) only
    // triggers one request.
    useEffect(() => {
        if (!getSocket()?.connected) connectSocket('admin');
        const socket = getSocket();
        if (!socket) return;

        const debouncedRefresh = () => {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(fetchKpis, 400);
        };

        socket.on('order:created', debouncedRefresh);
        socket.on('order:updated', debouncedRefresh);
        socket.on('receipt:paid', debouncedRefresh);

        return () => {
            socket.off('order:created', debouncedRefresh);
            socket.off('order:updated', debouncedRefresh);
            socket.off('receipt:paid', debouncedRefresh);
            clearTimeout(debounceRef.current);
        };
    }, [fetchKpis]);

    return { kpis, loading, error, refetch: fetchKpis };
}
