import { useState, useEffect } from 'react';
import { createOrder } from '../api/orderApi';
import { getReceiptsByWaiter } from '../api/receiptApi';
import PrintReceipt from '../components/PrintReceipt';
import api from '../api/api';

export default function WaiterPage() {
    const [waiters, setWaiters] = useState([]);
    const [selectedWaiter, setSelectedWaiter] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [items, setItems] = useState([{ meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);
    const [receipts, setReceipts] = useState([]);
    const [printData, setPrintData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('order');

    useEffect(() => {
        fetchWaiters();
    }, []);

    useEffect(() => {
        if (selectedWaiter) fetchReceipts();
    }, [selectedWaiter]);

    const fetchWaiters = async () => {
        try {
            const res = await api.get('/api/auth/waiters');
            setWaiters(res.data);
        } catch (err) {
            console.error('Failed to fetch waiters', err);
        }
    };

    const fetchReceipts = async () => {
        try {
            const res = await getReceiptsByWaiter(selectedWaiter);
            setReceipts(res.data);
        } catch (err) {
            console.error('Failed to fetch receipts', err);
        }
    };

    const updateItem = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        if (field === 'quantity' || field === 'unit_price') {
            updated[index].line_total = updated[index].quantity * parseFloat(updated[index].unit_price || 0);
        }
        setItems(updated);
    };

    const addItem = () => {
        setItems([...items, { meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);

    const handleCreateOrder = async () => {
        if (!selectedWaiter) return alert('Please select your name first');
        if (!tableNumber) return alert('Please enter a table number');
        if (items.some(i => !i.meal_name || !i.unit_price)) return alert('Please fill in all items');

        setLoading(true);
        try {
            const res = await createOrder({
                table_number: tableNumber,
                waiter_name: selectedWaiter,
                items,
                subtotal
            });

            setPrintData({
                ...res.data.receipt,
                items,
                waiter_name: selectedWaiter,
                table_number: tableNumber
            });

            setTableNumber('');
            setItems([{ meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);
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
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🍴</span>
                    <span className="font-black text-lg">Resto<span className="text-orange-500">POS</span></span>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }}
                    className="text-gray-400 hover:text-white text-sm font-semibold transition-colors"
                >
                    Sign Out
                </button>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-8">
                {/* Waiter selector */}
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">
                        Who are you?
                    </label>
                    <select
                        value={selectedWaiter}
                        onChange={(e) => setSelectedWaiter(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    >
                        <option value="">Select your name...</option>
                        {waiters.map((w) => (
                            <option key={w.id} value={w.full_name}>{w.full_name}</option>
                        ))}
                    </select>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('order')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === 'order' ? 'bg-orange-500 text-white' : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-500'}`}
                    >
                        📋 New Order
                    </button>
                    <button
                        onClick={() => { setActiveTab('receipts'); fetchReceipts(); }}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === 'receipts' ? 'bg-orange-500 text-white' : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-500'}`}
                    >
                        🧾 My Receipts {receipts.length > 0 && `(${receipts.length})`}
                    </button>
                </div>

                {/* Order Form */}
                {activeTab === 'order' && (
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                        <h2 className="text-xl font-black mb-6">New Order</h2>

                        <div className="mb-6">
                            <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Table Number</label>
                            <input
                                type="number"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                placeholder="e.g. 5"
                            />
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase tracking-widest px-1">
                                <span className="col-span-5">Item</span>
                                <span className="col-span-2">Qty</span>
                                <span className="col-span-3">Price</span>
                                <span className="col-span-2">Total</span>
                            </div>
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Item name"
                                        value={item.meal_name}
                                        onChange={(e) => updateItem(index, 'meal_name', e.target.value)}
                                        className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                                    />
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                        className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                        className="col-span-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                                    />
                                    <div className="col-span-1 text-sm text-gray-400 text-right">
                                        {item.line_total || 0}
                                    </div>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="col-span-1 text-red-400 hover:text-red-300 text-lg font-bold text-center"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addItem}
                            className="text-orange-500 hover:text-orange-400 text-sm font-semibold mb-6"
                        >
                            + Add Item
                        </button>

                        <div className="border-t border-gray-700 pt-4 flex items-center justify-between mb-6">
                            <span className="text-gray-400">Subtotal</span>
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
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black">My Receipts</h2>
                            <button onClick={fetchReceipts} className="text-gray-400 hover:text-white text-sm">↻ Refresh</button>
                        </div>

                        {!selectedWaiter ? (
                            <div className="text-center text-gray-600 py-12">Select your name first</div>
                        ) : receipts.length === 0 ? (
                            <div className="text-center text-gray-600 py-12">No unpaid receipts</div>
                        ) : (
                            <div className="space-y-3">
                                {receipts.map((r) => (
                                    <div key={r.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-orange-400">{r.receipt_number}</span>
                                            <span className="text-gray-500 text-sm ml-2">Table {r.table_number}</span>
                                            <div className="text-xs text-gray-500 mt-1">{r.items?.length} items</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-white">KES {r.subtotal}</span>
                                            <button
                                                onClick={() => handlePrint(r)}
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
        </div>
    );
}