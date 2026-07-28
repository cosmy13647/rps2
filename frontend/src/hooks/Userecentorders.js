import { useCallback, useEffect, useRef, useState } from 'react';
import { getRecentOrders } from '../api/dashboardApi';
import { getSocket, connectSocket } from '../api/socket';

export default function useRecentOrders(limit = 10) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchingRef = useRef(false);
    const mountedRef = useRef(true);
    const debounceRef = useRef(null);

    const fetchOrders = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setError(null);
        try {
            const res = await getRecentOrders(limit);
            if (!mountedRef.current) return;
            setOrders(res.data);
        } catch (err) {
            if (!mountedRef.current) return;
            console.error('Failed to load recent orders', err);
            setError('Could not load recent orders');
        } finally {
            if (mountedRef.current) setLoading(false);
            fetchingRef.current = false;
        }
    }, [limit]);

    useEffect(() => {
        mountedRef.current = true;
        fetchOrders();
        return () => {
            mountedRef.current = false;
        };
    }, [fetchOrders]);

    useEffect(() => {
        if (!getSocket()?.connected) connectSocket('admin');
        const socket = getSocket();
        if (!socket) return;

        const debouncedRefresh = () => {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(fetchOrders, 400);
        };

        socket.on('order:created', debouncedRefresh);
        socket.on('order:updated', debouncedRefresh);

        return () => {
            socket.off('order:created', debouncedRefresh);
            socket.off('order:updated', debouncedRefresh);
            clearTimeout(debounceRef.current);
        };
    }, [fetchOrders]);

    return { orders, loading, error, refetch: fetchOrders };
}