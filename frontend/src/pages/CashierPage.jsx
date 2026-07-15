import { useState, useEffect } from 'react';
import { getUnpaidReceipts, payReceipt } from '../api/receiptApi';
import {
    getCurrentShift,
    openShift,
    addPettyCash,
    getShiftSummary,
    closeShift,
} from '../api/shiftApi';
import { getSocket } from '../api/socket';
export default function CashierPage() {
    const user = JSON.parse(localStorage.getItem('user'));

    const [shift, setShift] = useState(undefined); // undefined = loading, null = none open
    const [openingFloat, setOpeningFloat] = useState('');
    const [shiftLoading, setShiftLoading] = useState(false);

    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [loading, setLoading] = useState(false);

    const [showPettyCash, setShowPettyCash] = useState(false);
    const [pettyAmount, setPettyAmount] = useState('');
    const [pettyReason, setPettyReason] = useState('');

    const [showCloseShift, setShowCloseShift] = useState(false);
    const [summary, setSummary] = useState(null);
    const [closingCount, setClosingCount] = useState('');
    const [tipsDeclared, setTipsDeclared] = useState('');
    const [closeNotes, setCloseNotes] = useState('');
const [notification, setNotification] = useState(null)
    useEffect(() => {
        loadShift();
    }, []);

    useEffect(() => {
        if (shift) fetchReceipts();
    }, [shift]);


    useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('order:ready', (payload) => {
        setNotification(payload);
    });

    return () => socket.off('order:ready');
}, []);

    const loadShift = async () => {
        try {
            const res = await getCurrentShift();
            setShift(res.data); // null if none open
        } catch (err) {
            console.error('Failed to load current shift', err);
            setShift(null);
        }
    };

    const fetchReceipts = async () => {
        try {
            const res = await getUnpaidReceipts();
            setReceipts(res.data);
        } catch (err) {
            console.error('Failed to fetch receipts', err);
        }
    };

    const handleOpenShift = async () => {
        if (!openingFloat || isNaN(openingFloat)) return alert('Enter a valid opening float');
        setShiftLoading(true);
        try {
            const res = await openShift(parseFloat(openingFloat));
            setShift(res.data);
            setOpeningFloat('');
        } catch (err) {
            console.error('Failed to open shift', err);
            alert(err.response?.data?.message || 'Failed to open shift');
        }
        setShiftLoading(false);
    };

    const handlePayment = async () => {
        if (paymentMethod === 'mpesa_paybill' && !paymentReference.trim()) {
            return alert('Business/account number is required for Paybill payments');
        }
        setLoading(true);
        try {
            await payReceipt(selectedReceipt.id, {
                payment_method: paymentMethod,
                amount_paid: parseFloat(amountPaid) || selectedReceipt.subtotal,
                payment_reference: paymentReference.trim() || null,
            });
            setSelectedReceipt(null);
            setPaymentMethod('');
            setAmountPaid('');
            setPaymentReference('');
            fetchReceipts();
        } catch (err) {
            console.error('Payment failed', err);
            alert(err.response?.data?.message || 'Payment failed');
        }
        setLoading(false);
    };

    const handleAddPettyCash = async () => {
        if (!pettyAmount || isNaN(pettyAmount) || pettyAmount <= 0) return alert('Enter a valid amount');
        if (!pettyReason.trim()) return alert('Enter a reason');
        try {
            await addPettyCash(shift.id, parseFloat(pettyAmount), pettyReason.trim());
            setShowPettyCash(false);
            setPettyAmount('');
            setPettyReason('');
        } catch (err) {
            console.error('Failed to add petty cash', err);
            alert(err.response?.data?.message || 'Failed to log paid-out');
        }
    };

    const openCloseShiftModal = async () => {
        try {
            const res = await getShiftSummary(shift.id);
            setSummary(res.data);
            setShowCloseShift(true);
        } catch (err) {
            console.error('Failed to load shift summary', err);
            alert('Could not load shift summary');
        }
    };

    const handleCloseShift = async () => {
        if (!closingCount || isNaN(closingCount)) return alert('Enter the counted cash amount');
        setShiftLoading(true);
        try {
            await closeShift(shift.id, {
                closing_cash_count: parseFloat(closingCount),
                tips_declared: parseFloat(tipsDeclared) || 0,
                notes: closeNotes.trim() || null,
            });
            setShowCloseShift(false);
            setClosingCount('');
            setTipsDeclared('');
            setCloseNotes('');
            setSummary(null);
            setShift(null); // back to the "open a shift" gate
        } catch (err) {
            console.error('Failed to close shift', err);
            alert(err.response?.data?.message || 'Failed to close shift');
        }
        setShiftLoading(false);
    };

    const previewVariance = () => {
        if (!summary || !closingCount || isNaN(closingCount)) return null;
        return parseFloat(closingCount) - summary.expected_cash;
    };

    if (shift === undefined) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!shift) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="bg-white border border-orange-200 shadow-sm rounded-2xl p-8 w-full max-w-sm">
                    <div className="text-4xl mb-4 text-center">🔓</div>
                    <h2 className="text-xl font-black text-center mb-2 text-gray-900">Open Shift</h2>
                    <p className="text-gray-500 text-sm text-center mb-6">
                        Count the drawer and enter the starting float to begin.
                    </p>
                    <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
                        Opening Float (KES)
                    </label>
                    <input
                        type="number"
                        value={openingFloat}
                        onChange={(e) => setOpeningFloat(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 mb-6 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        placeholder="e.g. 2000"
                    />
                    <button
                        onClick={handleOpenShift}
                        disabled={shiftLoading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                        {shiftLoading ? 'Opening...' : 'Open Shift'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <nav className="bg-white border-b border-orange-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🍴</span>
                    <span className="font-black text-lg text-gray-900">Resto<span className="text-orange-500">POS</span></span>
                </div>
                <span className="text-gray-500 text-sm">👤 {user?.full_name} · {user?.role}</span>
            </nav>

            <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-gray-600">
                    Shift opened by <span className="text-gray-900 font-semibold">{shift.opened_by_name}</span>
                    {' · '}
                    Float: <span className="text-gray-900 font-semibold">KES {shift.opening_float}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPettyCash(true)}
                        className="text-sm font-semibold px-4 py-2 rounded-lg border border-orange-300 bg-white text-gray-700 hover:border-orange-500 transition-colors"
                    >
                        💸 Log Paid-Out
                    </button>
                    <button
                        onClick={openCloseShiftModal}
                        className="text-sm font-semibold px-4 py-2 rounded-lg bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
                        🔒 Close Shift
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="bg-white border border-orange-200 shadow-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Awaiting Payment</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} to confirm
                            </p>
                        </div>
                        <button onClick={fetchReceipts} className="text-gray-500 hover:text-orange-600 text-sm">↻ Refresh</button>
                    </div>

                    {receipts.length === 0 ? (
                        <div className="text-center text-gray-400 py-16">
                            <div className="text-5xl mb-3">✅</div>
                            <div className="font-bold text-gray-600">All caught up — no unpaid receipts</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {receipts.map((r) => (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedReceipt(r)}
                                    className="bg-white border border-gray-200 hover:border-orange-400 rounded-xl p-4 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-orange-600">{r.receipt_number}</span>
                                            <span className="text-gray-500 text-sm ml-2">Table {r.table_number}</span>
                                        </div>
                                        <span className="font-black text-gray-900">KES {r.subtotal}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Waiter: {r.waiter_name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedReceipt && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white border border-orange-200 shadow-xl rounded-2xl p-8 w-full max-w-md">
                        <h3 className="text-xl font-black mb-2 text-gray-900">Process Payment</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {selectedReceipt.receipt_number} · Table {selectedReceipt.table_number}
                        </p>

                        <div className="text-3xl font-black text-orange-500 mb-6">
                            KES {selectedReceipt.subtotal}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`py-3 rounded-xl font-bold border transition-colors ${paymentMethod === 'cash' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 text-gray-600 hover:border-orange-400'}`}
                            >
                                💵 Cash
                            </button>
                            <button
                                onClick={() => setPaymentMethod('mpesa_till')}
                                className={`py-3 rounded-xl font-bold border transition-colors ${paymentMethod === 'mpesa_till' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 text-gray-600 hover:border-orange-400'}`}
                            >
                                📱 M-Pesa Till
                            </button>
                            <button
                                onClick={() => setPaymentMethod('mpesa_paybill')}
                                className={`py-3 rounded-xl font-bold border transition-colors ${paymentMethod === 'mpesa_paybill' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 text-gray-600 hover:border-orange-400'}`}
                            >
                                🏢 Paybill
                            </button>
                            <button
                                onClick={() => setPaymentMethod('mpesa_pochi')}
                                className={`py-3 rounded-xl font-bold border transition-colors ${paymentMethod === 'mpesa_pochi' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 text-gray-600 hover:border-orange-400'}`}
                            >
                                👛 Pochi
                            </button>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="mb-6">
                                <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Amount Received</label>
                                <input
                                    type="number"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                    placeholder={selectedReceipt.subtotal}
                                />
                                {amountPaid && (
                                    <p className="text-green-600 text-sm mt-2">
                                        Change: KES {(parseFloat(amountPaid) - parseFloat(selectedReceipt.subtotal)).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}

                        {paymentMethod === 'mpesa_paybill' && (
                            <div className="mb-6">
                                <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
                                    Business/Account Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                    placeholder="e.g. 123456 / Account123"
                                />
                            </div>
                        )}

                        {(paymentMethod === 'mpesa_till' || paymentMethod === 'mpesa_pochi') && (
                            <div className="mb-6">
                                <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
                                    Transaction Code (optional)
                                </label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                    placeholder="e.g. QGH7XXXXXX"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setSelectedReceipt(null);
                                    setPaymentMethod('');
                                    setAmountPaid('');
                                    setPaymentReference('');
                                }}
                                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 hover:border-gray-400 font-semibold transition-colors"
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

            {showPettyCash && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white border border-orange-200 shadow-xl rounded-2xl p-8 w-full max-w-sm">
                        <h3 className="text-xl font-black mb-6 text-gray-900">Log Paid-Out</h3>
                        <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Amount (KES)</label>
                        <input
                            type="number"
                            value={pettyAmount}
                            onChange={(e) => setPettyAmount(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 mb-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            placeholder="e.g. 500"
                        />
                        <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Reason</label>
                        <input
                            type="text"
                            value={pettyReason}
                            onChange={(e) => setPettyReason(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 mb-6 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            placeholder="e.g. Bought cleaning supplies"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPettyCash(false); setPettyAmount(''); setPettyReason(''); }}
                                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 hover:border-gray-400 font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddPettyCash}
                                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors"
                            >
                                Log It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCloseShift && summary && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white border border-orange-200 shadow-xl rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-black mb-6 text-gray-900">Close Shift</h3>

                        <div className="space-y-2 mb-6 text-sm">
                            <SummaryRow label="Opening Float" value={summary.opening_float} />
                            <SummaryRow label="Cash Sales" value={summary.cash_sales} />
                            <SummaryRow label="M-Pesa Till" value={summary.mpesa_till} />
                            <SummaryRow label="Paybill" value={summary.mpesa_paybill} />
                            <SummaryRow label="Pochi" value={summary.mpesa_pochi} />
                            <SummaryRow label="Petty Cash Out" value={-summary.petty_cash_out} />
                            <div className="border-t border-gray-200 my-2" />
                            <SummaryRow label="Expected Cash" value={summary.expected_cash} bold />
                            <SummaryRow label="Grand Total (all methods)" value={summary.grand_total} bold />
                            {summary.voided_total > 0 && (
                                <SummaryRow label="Voided (info only)" value={summary.voided_total} muted />
                            )}
                        </div>

                        {summary.pending_void_requests > 0 && (
                            <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 text-sm px-4 py-3 rounded-xl mb-6">
                                ⚠️ {summary.pending_void_requests} void request{summary.pending_void_requests !== 1 ? 's' : ''} still
                                pending approval for this shift.
                            </div>
                        )}

                        <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
                            Counted Cash (KES)
                        </label>
                        <input
                            type="number"
                            value={closingCount}
                            onChange={(e) => setClosingCount(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 mb-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            placeholder="Count the drawer and enter the total"
                        />
                        {previewVariance() !== null && (
                            <p className={`text-sm mb-4 font-semibold ${previewVariance() === 0 ? 'text-green-600' : previewVariance() > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {previewVariance() === 0
                                    ? '✅ Balanced'
                                    : previewVariance() > 0
                                    ? `Overage: KES ${previewVariance().toFixed(2)}`
                                    : `Shortage: KES ${Math.abs(previewVariance()).toFixed(2)}`}
                            </p>
                        )}

                        <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
                            Tips Declared (KES)
                        </label>
                        <input
                            type="number"
                            value={tipsDeclared}
                            onChange={(e) => setTipsDeclared(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 mb-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            placeholder="0"
                        />

                        <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
                            Notes (optional)
                        </label>
                        <textarea
                            value={closeNotes}
                            onChange={(e) => setCloseNotes(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 mb-6 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            rows={2}
                            placeholder="Anything worth flagging about this shift"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCloseShift(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 hover:border-gray-400 font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCloseShift}
                                disabled={shiftLoading}
                                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-50"
                            >
                                {shiftLoading ? 'Closing...' : 'Confirm & Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {notification && (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
        <div className="bg-gray-900 border-2 border-orange-500 rounded-2xl p-8 w-full max-w-sm text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-2xl font-black text-orange-400 mb-2">Order Ready!</h3>
            <p className="text-gray-300 mb-1">
                <span className="font-bold text-white">
                    {notification.order_type === 'takeaway' ? 'Take Away' : 'Delivery'} order is ready
                </span>
            </p>
            <p className="text-gray-400 text-sm mb-6">Coordinate with kitchen for handoff</p>
            <button
                onClick={() => setNotification(null)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl transition-colors"
            >
                Got it ✓
            </button>
        </div>
    </div>
)}
        </div>
    );
}

function SummaryRow({ label, value, bold, muted }) {
    return (
        <div className="flex items-center justify-between">
            <span className={muted ? 'text-gray-400' : 'text-gray-500'}>{label}</span>
            <span className={bold ? 'font-black text-gray-900' : muted ? 'text-gray-400' : 'text-gray-700'}>
                KES {Number(value).toFixed(2)}
            </span>
        </div>
    );
}