import { useState, useEffect } from 'react';
import { createOrder } from '../api/orderApi';
import { getUnpaidReceipts, payReceipt } from '../api/receiptApi';
import PrintReceipt from '../components/PrintReceipt';
export default function CashierPage() {
    const user = JSON.parse(localStorage.getItem('user'));

    // Order form state
    const [tableNumber, setTableNumber] = useState('');
    const [waiterName, setWaiterName] = useState('');
    const [items, setItems] = useState([{ meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);

    // Receipts state
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [loading, setLoading] = useState(false);
const [printData, setPrintData] = useState(null);
    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        try {
            const res = await getUnpaidReceipts();
            setReceipts(res.data);
        } catch (err) {
            console.error('Failed to fetch receipts', err);
        }
    };

    const updateItem = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        if (field === 'quantity' || field === 'unit_price') {
            updated[index].line_total = updated[index].quantity * updated[index].unit_price;
        }
        setItems(updated);
    };

    const addItem = () => {
        setItems([...items, { meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);

    const handleCreateOrder = async () => {
        setLoading(true);
        try {
            await createOrder({ table_number: tableNumber, waiter_name: waiterName, items, subtotal });
            setTableNumber('');
            setWaiterName('');
            setItems([{ meal_name: '', quantity: 1, unit_price: '', line_total: 0 }]);
            fetchReceipts();
            const res = await createOrder({ table_number: tableNumber, waiter_name: waiterName, items, subtotal });
setPrintData({ ...res.data.receipt, items, waiter_name: waiterName, table_number: tableNumber });
fetchReceipts();
window.print();
            window.print();
        } catch (err) {
            console.error('Failed to create order', err);
        }
        setLoading(false);
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            await payReceipt(selectedReceipt.id, {
                payment_method: paymentMethod,
                amount_paid: parseFloat(amountPaid) || selectedReceipt.subtotal
            });
            setSelectedReceipt(null);
            setPaymentMethod('');
            setAmountPaid('');
            fetchReceipts();
        } catch (err) {
            console.error('Payment failed', err);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🍴</span>
                    <span className="font-black text-lg">Resto<span className="text-orange-500">POS</span></span>
                </div>
                <span className="text-gray-400 text-sm">👤 {user?.full_name} · {user?.role}</span>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT — Order Form */}
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                    <h2 className="text-xl font-black mb-6">New Order</h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Table Number</label>
                            <input
                                type="number"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                placeholder="e.g. 5"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Waiter Name</label>
                            <input
                                type="text"
                                value={waiterName}
                                onChange={(e) => setWaiterName(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                placeholder="e.g. John"
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-4">
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
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                    className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={item.unit_price}
                                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                    className="col-span-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                                />
                                <span className="col-span-1 text-sm text-gray-400 text-right">
                                    {item.line_total || 0}
                                </span>
                                <button
                                    onClick={() => removeItem(index)}
                                    className="col-span-1 text-red-400 hover:text-red-300 text-lg font-bold"
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
                        {loading ? 'Creating...' : 'Create Order & Print Receipt'}
                    </button>
                </div>

                {/* RIGHT — Unpaid Receipts */}
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black">Unpaid Receipts</h2>
                        <button onClick={fetchReceipts} className="text-gray-400 hover:text-white text-sm">↻ Refresh</button>
                    </div>

                    {receipts.length === 0 ? (
                        <div className="text-center text-gray-600 py-12">No unpaid receipts</div>
                    ) : (
                        <div className="space-y-3">
                            {receipts.map((r) => (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedReceipt(r)}
                                    className="bg-gray-800 border border-gray-700 hover:border-orange-500/40 rounded-xl p-4 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-orange-400">{r.receipt_number}</span>
                                            <span className="text-gray-500 text-sm ml-2">Table {r.table_number}</span>
                                        </div>
                                        <span className="font-black text-white">KES {r.subtotal}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Waiter: {r.waiter_name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
                        <h3 className="text-xl font-black mb-2">Process Payment</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            {selectedReceipt.receipt_number} · Table {selectedReceipt.table_number}
                        </p>

                        <div className="text-3xl font-black text-orange-500 mb-6">
                            KES {selectedReceipt.subtotal}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`py-3 rounded-xl font-bold border transition-colors ${paymentMethod === 'cash' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-700 text-gray-400 hover:border-orange-500/40'}`}
                            >
                                💵 Cash
                            </button>
                            <button
                                onClick={() => setPaymentMethod('mpesa_till')}
                                className={`py-3 rounded-xl font-bold border transition-colors ${paymentMethod === 'mpesa_till' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-700 text-gray-400 hover:border-orange-500/40'}`}
                            >
                                📱 M-Pesa Till
                            </button>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="mb-6">
                                <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Amount Received</label>
                                <input
                                    type="number"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                    placeholder={selectedReceipt.subtotal}
                                />
                                {amountPaid && (
                                    <p className="text-green-400 text-sm mt-2">
                                        Change: KES {(parseFloat(amountPaid) - parseFloat(selectedReceipt.subtotal)).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setSelectedReceipt(null); setPaymentMethod(''); setAmountPaid(''); }}
                                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:border-gray-500 font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={!paymentMethod || loading}
                                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {printData && <PrintReceipt receipt={printData} />}
        </div>
        
    );
}