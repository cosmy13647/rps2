import { useCallback, useEffect, useRef, useState } from 'react';
import { getRecentReceipts } from '../api/dashboardApi';
import { getSocket, connectSocket } from '../api/socket';

export default function useRecentReceipts(limit = 10) {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchingRef = useRef(false);
    const mountedRef = useRef(true);
    const debounceRef = useRef(null);

    const fetchReceipts = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setError(null);
        try {
            const res = await getRecentReceipts(limit);
            if (!mountedRef.current) return;
            setReceipts(res.data);
        } catch (err) {
            if (!mountedRef.current) return;
            console.error('Failed to load recent receipts', err);
            setError('Could not load recent transactions');
        } finally {
            if (mountedRef.current) setLoading(false);
            fetchingRef.current = false;
        }
    }, [limit]);

    useEffect(() => {
        mountedRef.current = true;
        fetchReceipts();
        return () => {
            mountedRef.current = false;
        };
    }, [fetchReceipts]);

    useEffect(() => {
        if (!getSocket()?.connected) connectSocket('admin');
        const socket = getSocket();
        if (!socket) return;

        const debouncedRefresh = () => {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(fetchReceipts, 400);
        };

        socket.on('receipt:paid', debouncedRefresh);
        socket.on('order:created', debouncedRefresh); // a new order also creates a fresh unpaid receipt

        return () => {
            socket.off('receipt:paid', debouncedRefresh);
            socket.off('order:created', debouncedRefresh);
            clearTimeout(debounceRef.current);
        };
    }, [fetchReceipts]);

    return { receipts, loading, error, refetch: fetchReceipts };
}
