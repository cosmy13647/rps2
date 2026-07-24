import { useState, useEffect } from 'react';
import { createOrder } from '../api/orderApi';
import { getReceiptsByWaiter } from '../api/receiptApi';
import PrintReceipt from '../components/PrintReceipt';
import api from '../api/api';
import { getSocket } from '../api/socket';

export default function WaiterPage() {
    const [waiters, setWaiters] = useState([]);
    const [selectedWaiter, setSelectedWaiter] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [items, setItems] = useState([{ meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);
    const [receipts, setReceipts] = useState([]);
    const [printData, setPrintData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('order');
    const [notification, setNotification] = useState(null);
    const [orderType, setOrderType] = useState('table');
    const [orderInputMode, setOrderInputMode] = useState('menu');

    const [menu, setMenu] = useState([]);
    const [menuCategory, setMenuCategory] = useState('all');
    const [selectedModifiers, setSelectedModifiers] = useState({});

    useEffect(() => { fetchWaiters(); }, []);
    useEffect(() => { if (selectedWaiter) fetchReceipts(); }, [selectedWaiter]);
    useEffect(() => {
        api.get('/api/menu').then(res => setMenu(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        socket.on('order:ready', (payload) => setNotification(payload));
        return () => socket.off('order:ready');
    }, []);

    const fetchWaiters = async () => {
        try {
            const res = await api.get('/api/auth/waiters');
            setWaiters(res.data);
        } catch (err) { console.error('Failed to fetch waiters', err); }
    };

    const fetchReceipts = async () => {
        try {
            const res = await getReceiptsByWaiter(selectedWaiter);
            setReceipts(res.data);
        } catch (err) { console.error('Failed to fetch receipts', err); }
    };

    const updateItem = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        if (field === 'quantity' || field === 'unit_price') {
            updated[index].line_total = updated[index].quantity * parseFloat(updated[index].unit_price || 0);
        }
        setItems(updated);
    };

    const addItem = () => setItems([...items, { meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);

    const removeItem = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const categories = ['all', ...new Set(menu.map(m => m.category))];
    const visibleMenu = menuCategory === 'all' ? menu : menu.filter(m => m.category === menuCategory);

    const addFromMenu = (menuItem) => {
        const modifier = selectedModifiers[menuItem.id];
        const meal_name = modifier ? `${menuItem.name} — ${modifier}` : menuItem.name;
        const existing = items.findIndex(i => i._menuId === menuItem.id && i.meal_name === meal_name);

        if (existing >= 0) {
            const updated = [...items];
            updated[existing].quantity += 1;
            updated[existing].line_total = updated[existing].quantity * parseFloat(menuItem.price);
            setItems(updated);
        } else {
            const newItem = {
                _menuId: menuItem.id,
                meal_name,
                quantity: 1,
                unit_price: parseFloat(menuItem.price),
                line_total: parseFloat(menuItem.price)
            };
            const filtered = items.filter(i => i.meal_name || i.unit_price);
            setItems([...filtered, newItem]);
        }
    };

    const removeFromCart = (index) => {
        if (items.length === 1) {
            setItems([{ meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);
        } else {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const changeCartQty = (index, delta) => {
        const updated = [...items];
        updated[index].quantity = Math.max(1, updated[index].quantity + delta);
        updated[index].line_total = updated[index].quantity * parseFloat(updated[index].unit_price || 0);
        setItems(updated);
    };

    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);

    const handleCreateOrder = async () => {
        if (!selectedWaiter) return alert('Please select your name first');
        if (!tableNumber && orderType === 'table') return alert('Please enter a table number');
        const validItems = items.filter(i => i.meal_name && i.unit_price);
        if (validItems.length === 0) return alert('Please add at least one item');

        setLoading(true);
        try {
            const res = await createOrder({
                table_number: orderType === 'table' ? tableNumber : null,
                customer_ref: orderType !== 'table' ? tableNumber : null,
                waiter_name: selectedWaiter,
                items: validItems,
                subtotal,
                order_type: orderType
            });

            setPrintData({
                ...res.data.receipt,
                items: validItems,
                waiter_name: selectedWaiter,
                table_number: tableNumber
            });

            setTableNumber('');
            setItems([{ meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);
            setSelectedModifiers({});
            fetchReceipts();
            setTimeout(() => window.print(), 300);
        } catch (err) {
            console.error('Failed to create order', err);
            alert('Failed to create order. Please try again.');
        }
        setLoading(false);
    };

    const handlePrint = (receipt) => {
        setPrintData(receipt);
        setTimeout(() => window.print(), 300);
    };

    return (
        <div className="min-h-screen bg-stone-50 text-stone-900">
            {/* Header */}
            <nav className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🍴</span>
                    <span className="font-black text-lg text-stone-900">Resto<span className="text-orange-500">POS</span></span>
                </div>
                <button
                    onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
                    className="text-stone-400 hover:text-stone-700 text-sm font-semibold transition-colors"
                >
                    Sign Out
                </button>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Waiter selector */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-2 block">Who are you?</label>
                    <select
                        value={selectedWaiter}
                        onChange={(e) => setSelectedWaiter(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-stone-900 focus:outline-none focus:border-orange-500"
                    >
                        <option value="">Select your name...</option>
                        {waiters.map((w) => (
                            <option key={w.id} value={w.full_name}>{w.full_name}</option>
                        ))}
                    </select>
                </div>

                {/* Main Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('order')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === 'order' ? 'bg-orange-500 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:border-orange-300'}`}
                    >
                        📋 New Order
                    </button>
                    <button
                        onClick={() => { setActiveTab('receipts'); fetchReceipts(); }}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === 'receipts' ? 'bg-orange-500 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:border-orange-300'}`}
                    >
                        🧾 My Receipts {receipts.length > 0 && `(${receipts.length})`}
                    </button>
                </div>

                {/* Order Form */}
                {activeTab === 'order' && (
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-black mb-6 text-stone-900">New Order</h2>

                        {/* Order Type */}
                        <div className="mb-4">
                            <label className="text-xs text-stone-400 uppercase tracking-widest mb-1 block">Order Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['table', 'takeaway', 'delivery'].map((type) => (
                                    <button key={type} type="button" onClick={() => setOrderType(type)}
                                        className={`py-2 rounded-lg text-sm font-bold capitalize transition-colors ${orderType === type ? 'bg-orange-500 text-white' : 'bg-stone-100 border border-stone-200 text-stone-500 hover:border-orange-300'}`}
                                    >
                                        {type === 'table' ? '🍽️' : type === 'takeaway' ? '📦' : '🛵'} {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table / Customer ref */}
                        <div className="mb-6">
                            <label className="text-xs text-stone-400 uppercase tracking-widest mb-1 block">
                                {orderType === 'table' ? 'Table Number' : 'Customer Name / Phone'}
                            </label>
                            <input
                                type="text"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-stone-900 focus:outline-none focus:border-orange-500"
                                placeholder={orderType === 'table' ? 'e.g. 5' : 'e.g. John / 0712345678'}
                            />
                        </div>

                        {/* Input mode tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setOrderInputMode('menu')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${orderInputMode === 'menu' ? 'bg-orange-100 text-orange-600 border border-orange-300' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}
                            >
                                🍴 From Menu
                            </button>
                            <button
                                onClick={() => setOrderInputMode('manual')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${orderInputMode === 'manual' ? 'bg-orange-100 text-orange-600 border border-orange-300' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}
                            >
                                ✏️ Manual Entry
                            </button>
                        </div>

                        {/* Menu Mode */}
                        {orderInputMode === 'menu' && (
                            <div className="mb-4">
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                                    {categories.map(c => (
                                        <button key={c} onClick={() => setMenuCategory(c)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${menuCategory === c ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}
                                        >
                                            {c === 'all' ? 'All' : c}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                                    {visibleMenu.map(item => (
                                        <div key={item.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                                            <div className="font-bold text-sm text-stone-900 mb-1">{item.name}</div>
                                            <div className="text-orange-500 font-black text-sm mb-2">KES {Number(item.price).toLocaleString()}</div>

                                            {item.modifiers && item.modifiers.length > 0 && (
                                                <select
                                                    value={selectedModifiers[item.id] || ''}
                                                    onChange={(e) => setSelectedModifiers(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-900 mb-2 focus:outline-none focus:border-orange-500"
                                                >
                                                    <option value="">No preference</option>
                                                    {item.modifiers.map(mod => (
                                                        <option key={mod} value={mod}>{mod}</option>
                                                    ))}
                                                </select>
                                            )}

                                            <button
                                                onClick={() => addFromMenu(item)}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manual Mode */}
                        {orderInputMode === 'manual' && (
                            <div className="space-y-3 mb-4">
                                <div className="grid grid-cols-12 gap-2 text-xs text-stone-400 uppercase tracking-widest px-1">
                                    <span className="col-span-5">Item</span>
                                    <span className="col-span-2">Qty</span>
                                    <span className="col-span-3">Price</span>
                                    <span className="col-span-2">Total</span>
                                </div>
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                        <input type="text" placeholder="Item name" value={item.meal_name}
                                            onChange={(e) => updateItem(index, 'meal_name', e.target.value)}
                                            className="col-span-5 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                                        />
                                        <input type="number" value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                            className="col-span-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                                        />
                                        <input type="number" placeholder="Price" value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                            className="col-span-3 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-orange-500"
                                        />
                                        <div className="col-span-1 text-sm text-stone-400 text-right">{item.line_total || 0}</div>
                                        <button onClick={() => removeItem(index)} className="col-span-1 text-red-400 hover:text-red-600 text-lg font-bold text-center">×</button>
                                    </div>
                                ))}
                                <button onClick={addItem} className="text-orange-500 hover:text-orange-600 text-sm font-semibold">+ Add Item</button>
                            </div>
                        )}

                        {/* Cart summary */}
                        {items.some(i => i.meal_name) && (
                            <div className="border border-stone-200 rounded-xl p-4 mb-4 mt-2 bg-stone-50">
                                <h3 className="text-xs text-stone-400 uppercase tracking-widest mb-3">Order Summary</h3>
                                <div className="space-y-2">
                                    {items.filter(i => i.meal_name).map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span className="text-stone-900 flex-1">{item.meal_name}</span>
                                            <div className="flex items-center gap-2 ml-2">
                                                <button onClick={() => changeCartQty(index, -1)} className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 text-xs font-bold">−</button>
                                                <span className="text-stone-900 font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => changeCartQty(index, 1)} className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 text-xs font-bold">+</button>
                                                <span className="text-stone-400 w-16 text-right">KES {item.line_total}</span>
                                                <button onClick={() => removeFromCart(index)} className="text-red-400 hover:text-red-600 text-sm font-bold ml-1">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subtotal */}
                        <div className="border-t border-stone-200 pt-4 flex items-center justify-between mb-6">
                            <span className="text-stone-500">Subtotal</span>
                            <span className="text-xl font-black text-orange-500">KES {subtotal.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleCreateOrder}
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Place Order & Print Receipt'}
                        </button>
                    </div>
                )}

                {/* Receipts Tab */}
                {activeTab === 'receipts' && (
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-stone-900">My Receipts</h2>
                            <button onClick={fetchReceipts} className="text-stone-400 hover:text-stone-700 text-sm">↻ Refresh</button>
                        </div>

                        {!selectedWaiter ? (
                            <div className="text-center text-stone-400 py-12">Select your name first</div>
                        ) : receipts.length === 0 ? (
                            <div className="text-center text-stone-400 py-12">No unpaid receipts</div>
                        ) : (
                            <div className="space-y-3">
                                {receipts.map((r) => (
                                    <div key={r.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-orange-500">{r.receipt_number}</span>
                                            <span className="text-stone-400 text-sm ml-2">Table {r.table_number}</span>
                                            <div className="text-xs text-stone-400 mt-1">{r.items?.length} items</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-stone-900">KES {r.subtotal}</span>
                                            <button onClick={() => handlePrint(r)}
                                                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                                            >
                                                🖨️ Print
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PrintReceipt receipt={printData} />

            {/* Order Ready Notification */}
            {notification && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white border-2 border-green-500 rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
                        <div className="text-5xl mb-4">🍽️</div>
                        <h3 className="text-2xl font-black text-green-600 mb-2">Order Ready!</h3>
                        <p className="text-stone-700 mb-1">
                            <span className="font-bold text-stone-900">Table {notification.table_number}</span>
                        </p>
                        <p className="text-stone-400 text-sm mb-6">{notification.waiter_name} — pick up from kitchen</p>
                        <button onClick={() => setNotification(null)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-colors"
                        >
                            Got it ✓
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}