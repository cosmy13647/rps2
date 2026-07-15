import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getPendingOrders, updateOrderStatus } from '../api/orderApi';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUS_FLOW = {
    pending:    { next: 'preparing', label: '▶ Start Preparing', color: 'bg-blue-600 hover:bg-blue-700' },
    preparing:  { next: 'ready',     label: '✅ Mark Ready',     color: 'bg-green-600 hover:bg-green-700' },
    ready:      { next: 'completed', label: '🍽️ Mark Served',    color: 'bg-gray-600 hover:bg-gray-700' },
};

const CARD_STYLE = {
    pending:   'border-red-500 bg-red-950/30',
    preparing: 'border-blue-500 bg-blue-950/30',
    ready:     'border-green-500 bg-green-950/30',
};

const STATUS_BADGE = {
    pending:   'bg-red-900 text-red-300',
    preparing: 'bg-blue-900 text-blue-300',
    ready:     'bg-green-900 text-green-300',
};

// Live elapsed timer — ticks every second
function ElapsedTimer({ createdAt, status }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const tick = () => {
            setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [createdAt]);

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const isLate = mins >= 10;
    const isWarning = mins >= 7;

    return (
        <div className={`text-lg font-black tabular-nums ${
            isLate ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-300'
        }`}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            {isLate && <span className="text-xs ml-1 animate-pulse">LATE</span>}
        </div>
    );
}

export default function KitchenPage() {
    const [orders, setOrders] = useState([]);
    const [newOrderIds, setNewOrderIds] = useState(new Set());
    const [soundOn, setSoundOn] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [pendingUpdates, setPendingUpdates] = useState([]); // offline queue

    const audioCtxRef = useRef(null);
    const alarmIntervalRef = useRef(null);
    const socketRef = useRef(null);

    // ---- Audio ----
    const playBeep = useCallback(() => {
        if (!soundOn) return;
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;
            [880, 1108].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.0001, now + i * 0.18);
                gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.18 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.18);
                osc.stop(now + i * 0.18 + 0.2);
            });
        } catch (err) {
            console.error('Audio alarm failed', err);
        }
    }, [soundOn]);

    const startAlarmLoop = useCallback(() => {
        if (alarmIntervalRef.current) return;
        playBeep();
        alarmIntervalRef.current = setInterval(playBeep, 1500);
    }, [playBeep]);

    const stopAlarmLoop = useCallback(() => {
        if (alarmIntervalRef.current) {
            clearInterval(alarmIntervalRef.current);
            alarmIntervalRef.current = null;
        }
    }, []);

    // ---- Flush offline queue when reconnected ----
    const flushPendingUpdates = useCallback(async (queue) => {
        if (queue.length === 0) return;
        for (const { orderId, status } of queue) {
            try {
                await updateOrderStatus(orderId, status);
            } catch (err) {
                console.error('Failed to flush update', orderId, err);
            }
        }
        setPendingUpdates([]);
    }, []);

    // ---- Load initial orders ----
    const loadInitialOrders = useCallback(async () => {
        try {
            const res = await getPendingOrders();
            setOrders(res.data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch pending orders', err);
            setError('Could not load existing orders. Will retry on reconnect.');
        }
    }, []);

    // ---- Socket setup ----
    useEffect(() => {
        loadInitialOrders();

        const socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            setError(null);
            // Reload orders on reconnect in case we missed anything
            loadInitialOrders();
            // Flush any updates that failed while offline
            setPendingUpdates((prev) => {
                flushPendingUpdates(prev);
                return prev;
            });
        });

        socket.on('disconnect', () => {
            setConnected(false);
            setError('Connection lost — working offline. Updates will sync when reconnected.');
        });

        socket.on('order:created', (payload) => {
            const newOrder = {
                ...payload.order,
                items: payload.items,
                waiter_name: payload.waiter_name,
                table_number: payload.table_number,
            };
            setOrders((prev) => {
                if (prev.some((o) => o.id === newOrder.id)) return prev;
                return [newOrder, ...prev]; // newest first
            });
            setNewOrderIds((prev) => new Set(prev).add(newOrder.id));
            startAlarmLoop();
        });

        socket.on('order:updated', (updatedOrder) => {
            if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
                setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
                setNewOrderIds((prev) => {
                    const next = new Set(prev);
                    next.delete(updatedOrder.id);
                    return next;
                });
            } else {
                setOrders((prev) =>
                    prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
                );
            }
        });

        return () => {
            socket.disconnect();
            stopAlarmLoop();
        };
    }, [loadInitialOrders, startAlarmLoop, stopAlarmLoop, flushPendingUpdates]);

    useEffect(() => {
        if (newOrderIds.size === 0) stopAlarmLoop();
    }, [newOrderIds, stopAlarmLoop]);

    // ---- Status update with offline queue ----
    const handleStatusUpdate = async (orderId, nextStatus) => {
        // Optimistic update — update UI immediately, don't wait for server
        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
        setNewOrderIds((prev) => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
        });

        if (nextStatus === 'completed') {
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
        }

        if (!connected) {
            // Queue for later if offline
            setPendingUpdates((prev) => [...prev, { orderId, status: nextStatus }]);
            return;
        }

        try {
            await updateOrderStatus(orderId, nextStatus);
        } catch (err) {
            console.error('Failed to update status', err);
            // Queue it as a fallback
            setPendingUpdates((prev) => [...prev, { orderId, status: nextStatus }]);
        }
    };

    const acknowledgeAll = () => setNewOrderIds(new Set());

    // Sort: new first, then by age
    const sortedOrders = [...orders].sort((a, b) => {
        const aNew = newOrderIds.has(a.id) ? 0 : 1;
        const bNew = newOrderIds.has(b.id) ? 0 : 1;
        if (aNew !== bNew) return aNew - bNew;
        return new Date(a.created_at) - new Date(b.created_at);
    });

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <span className="font-black text-lg">Kitchen<span className="text-orange-500">Display</span></span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${connected ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400 animate-pulse'}`}>
                        {connected ? '● Live' : '● Offline'}
                    </span>
                    {pendingUpdates.length > 0 && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-900 text-yellow-400">
                            {pendingUpdates.length} updates queued
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {/* Status legend */}
                    <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 mr-4">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>New</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Preparing</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Ready</span>
                    </div>
                    {newOrderIds.size > 0 && (
                        <button onClick={acknowledgeAll} className="bg-red-600 hover:bg-red-700 text-white text-sm font-black px-4 py-2 rounded-lg animate-pulse">
                            🔔 {newOrderIds.size} NEW — Silence
                        </button>
                    )}
                    <button onClick={() => setSoundOn((s) => !s)} className="text-gray-400 hover:text-white text-sm font-semibold">
                        {soundOn ? '🔊' : '🔇'}
                    </button>
                    <span className="text-gray-600 text-sm font-mono">
                        {orders.length} ticket{orders.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </nav>

            {/* Offline/error banner */}
            {error && (
                <div className="bg-red-900/60 border-b border-red-700 text-red-300 text-center py-2 text-sm font-semibold px-4">
                    ⚠️ {error}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-6">
                {sortedOrders.length === 0 ? (
                    <div className="text-center text-gray-700 py-32">
                        <div className="text-7xl mb-4">🍽️</div>
                        <div className="text-2xl font-black text-gray-600">Queue is clear</div>
                        <div className="text-gray-700 text-sm mt-2">New orders will appear instantly</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {sortedOrders.map((order) => {
                            const isNew = newOrderIds.has(order.id);
                            const flow = STATUS_FLOW[order.status];

                            return (
                                <div
                                    key={order.id}
                                    className={`rounded-xl border-4 overflow-hidden transition-colors ${
                                        isNew ? 'border-red-500 bg-red-950/30 animate-pulse' : CARD_STYLE[order.status] || 'border-gray-700 bg-gray-900'
                                    }`}
                                >
                                    {/* Ticket header */}
                                    <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="text-4xl font-black text-orange-500 leading-none">
                                                {order.table_number}
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 leading-none mb-0.5">
                                                    {order.waiter_name || 'Customer'}
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-800 text-gray-400'}`}>
                                                    {order.status?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <ElapsedTimer createdAt={order.created_at} status={order.status} />
                                    </div>

                                    {/* Items */}
                                    <div className="px-4 py-3 space-y-2">
                                        {(order.items || []).map((item, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="font-bold text-base text-white">{item.meal_name}</span>
                                                <span className="font-black text-xl text-orange-400 tabular-nums">×{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="px-4 pb-4 flex gap-2">
                                        {isNew && (
                                            <button
                                                onClick={() => {
                                                    setNewOrderIds((prev) => {
                                                        const next = new Set(prev);
                                                        next.delete(order.id);
                                                        return next;
                                                    });
                                                }}
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
                                            >
                                                🔕 Silence
                                            </button>
                                        )}
                                        {flow && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, flow.next)}
                                                className={`flex-1 ${flow.color} text-white font-bold py-2.5 rounded-lg text-sm transition-colors`}
                                            >
                                                {flow.label}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}