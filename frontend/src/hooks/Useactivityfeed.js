import { useEffect, useRef, useState } from 'react';
import { getSocket, connectSocket } from '../api/socket';

const MAX_EVENTS = 20;

// Turns a raw socket payload into a feed entry, or null to skip it
// (e.g. intermediate order statuses we don't want cluttering the feed).
function describeEvent(type, payload) {
    switch (type) {
        case 'order:created': {
            const table = payload.table_number ?? payload.order?.table_number ?? '—';
            const waiter = payload.waiter_name ?? payload.order?.waiter_name ?? 'unassigned';
            return { icon: '🧾', text: `New order received — Table ${table} (${waiter})` };
        }
        case 'order:updated': {
            if (payload.status === 'ready') {
                return { icon: '🔥', text: `Kitchen completed order — Table ${payload.table_number ?? '—'}` };
            }
            if (payload.status === 'cancelled') {
                return { icon: '❌', text: `Order cancelled — Table ${payload.table_number ?? '—'}` };
            }
            return null; // skip pending→preparing noise
        }
        case 'receipt:paid': {
            const isMpesa = (payload.payment_method || '').startsWith('mpesa');
            const amount = Number(payload.amount_paid ?? 0).toFixed(2);
            return {
                icon: isMpesa ? '💰' : '✅',
                text: `${isMpesa ? 'M-Pesa payment completed' : 'Receipt paid'} — ${payload.receipt_number} (KES ${amount})`,
            };
        }
        case 'shift:opened':
            return { icon: '⏱️', text: 'Shift opened' };
        default:
            return null;
    }
}

export default function useActivityFeed() {
    const [events, setEvents] = useState([]);
    const idRef = useRef(0);

    useEffect(() => {
        if (!getSocket()?.connected) connectSocket('admin');
        const socket = getSocket();
        if (!socket) return;

        const types = ['order:created', 'order:updated', 'receipt:paid', 'shift:opened'];
        const handlers = types.map((type) => {
            const handler = (payload) => {
                const described = describeEvent(type, payload);
                if (!described) return;
                idRef.current += 1;
                setEvents((prev) =>
                    [{ id: idRef.current, ...described, time: new Date().toISOString() }, ...prev].slice(0, MAX_EVENTS)
                );
            };
            socket.on(type, handler);
            return [type, handler];
        });

        return () => {
            handlers.forEach(([type, handler]) => socket.off(type, handler));
        };
    }, []);

    return events;
}