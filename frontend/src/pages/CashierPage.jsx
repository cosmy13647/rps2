import { useState, useEffect } from 'react';
import { getUnpaidReceipts, payReceipt } from '../api/receiptApi';

export default function CashierPage() {
    const user = JSON.parse(localStorage.getItem('user'));

    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [loading, setLoading] = useState(false);

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
            // Re-fetch from the server so a paid receipt is confirmed gone,
            // not just removed from local state.
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

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black">Awaiting Payment</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} to confirm
                            </p>
                        </div>
                        <button onClick={fetchReceipts} className="text-gray-400 hover:text-white text-sm">↻ Refresh</button>
                    </div>

                    {receipts.length === 0 ? (
                        <div className="text-center text-gray-600 py-16">
                            <div className="text-5xl mb-3">✅</div>
                            <div className="font-bold">All caught up — no unpaid receipts</div>
                        </div>
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
        </div>
    );
}
