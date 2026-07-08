import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getPendingOrders, updateOrderStatus } from '../api/orderApi';

// Reuses the same env var your api.js already uses for the axios baseURL —
// since Socket.IO runs on the same Render server as your API, no new
// environment variable needs to be added on Vercel.
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function KitchenPage() {
    const [orders, setOrders] = useState([]);
    const [newOrderIds, setNewOrderIds] = useState(new Set()); // orders not yet acknowledged
    const [soundOn, setSoundOn] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);

    const audioCtxRef = useRef(null);
    const alarmIntervalRef = useRef(null);

    // ---- Alarm: generate a sharp repeating beep with Web Audio, no file needed ----
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

    // ---- Initial load: fetch whatever was already pending before this screen opened ----
    const loadInitialOrders = useCallback(async () => {
        try {
            const res = await getPendingOrders();
            setOrders(res.data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch pending orders', err);
            setError('Could not load existing orders.');
        }
    }, []);

    // ---- Real-time updates via Socket.IO ----
    useEffect(() => {
        loadInitialOrders();

        const socket = io(SOCKET_URL);

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        // Server emits: { order, items, waiter_name, table_number }
        socket.on('order:created', (payload) => {
            const newOrder = {
                ...payload.order,
                items: payload.items,
                waiter_name: payload.waiter_name,
                table_number: payload.table_number,
            };

            setOrders((prev) => {
                if (prev.some((o) => o.id === newOrder.id)) return prev;
                return [...prev, newOrder];
            });
            setNewOrderIds((prev) => new Set(prev).add(newOrder.id));
            startAlarmLoop();
        });

        // Server emits the updated order row whenever status changes (from any screen)
        socket.on('order:updated', (updatedOrder) => {
            if (updatedOrder.status === 'done') {
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
    }, [loadInitialOrders, startAlarmLoop, stopAlarmLoop]);

    useEffect(() => {
        if (newOrderIds.size === 0) stopAlarmLoop();
    }, [newOrderIds, stopAlarmLoop]);

    const acknowledgeOrder = (orderId) => {
        setNewOrderIds((prev) => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
        });
    };

    const acknowledgeAll = () => setNewOrderIds(new Set());

    const markDone = async (orderId) => {
        acknowledgeOrder(orderId);
        try {
            await updateOrderStatus(orderId, 'done');
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
        } catch (err) {
            console.error('Failed to update order status', err);
            alert('Could not mark order as done. Please try again.');
        }
    };

    const minutesAgo = (createdAt) => {
        if (!createdAt) return 0;
        return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <span className="font-black text-lg">Kitchen<span className="text-orange-500">Display</span></span>
                    <span
                        className={`ml-3 text-xs font-bold px-2 py-1 rounded-full ${
                            connected ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                        }`}
                    >
                        {connected ? '● Live' : '● Reconnecting...'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {newOrderIds.size > 0 && (
                        <button
                            onClick={acknowledgeAll}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-black px-4 py-2 rounded-lg animate-pulse"
                        >
                            🔔 {newOrderIds.size} NEW — Silence All
                        </button>
                    )}
                    <button
                        onClick={() => setSoundOn((s) => !s)}
                        className="text-gray-400 hover:text-white text-sm font-semibold"
                        title="Toggle alarm sound"
                    >
                        {soundOn ? '🔊 Sound On' : '🔇 Sound Off'}
                    </button>
                </div>
            </nav>

            {error && (
                <div className="bg-red-900/50 border-b border-red-700 text-red-300 text-center py-2 text-sm font-semibold">
                    {error}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-8">
                {orders.length === 0 ? (
                    <div className="text-center text-gray-600 py-24">
                        <div className="text-6xl mb-4">🍽️</div>
                        <div className="text-2xl font-black">No orders in the queue</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {orders.map((order) => {
                            const isNew = newOrderIds.has(order.id);
                            const age = minutesAgo(order.created_at);
                            const isLate = age >= 10;

                            return (
                                <div
                                    key={order.id}
                                    className={`rounded-2xl p-6 border-4 transition-all ${
                                        isNew
                                            ? 'border-red-500 bg-red-950/40 animate-pulse'
                                            : isLate
                                            ? 'border-yellow-500 bg-yellow-950/20'
                                            : 'border-gray-700 bg-gray-900'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Table</div>
                                            <div className="text-6xl font-black leading-none text-orange-500">
                                                {order.table_number}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                                                {order.waiter_name}
                                            </div>
                                            <div className={`text-lg font-black ${isLate ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                {age} min ago
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        {(order.items || []).map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between bg-gray-800/70 rounded-lg px-4 py-3"
                                            >
                                                <span className="font-bold text-xl">{item.meal_name}</span>
                                                <span className="font-black text-2xl text-orange-400">×{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        {isNew && (
                                            <button
                                                onClick={() => acknowledgeOrder(order.id)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-sm"
                                            >
                                                🔕 Acknowledge
                                            </button>
                                        )}
                                        <button
                                            onClick={() => markDone(order.id)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl text-sm"
                                        >
                                            ✅ Mark Done
                                        </button>
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