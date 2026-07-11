import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { Receipt, Clock } from "lucide-react";
import useGuestSession from "../hooks/useGuestSession";
import BottomNav from "../components/BottomNav";
import api from "../api/api";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_STYLE = {
  pending:   "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const STATUS_LABEL = { pending: "Pending", completed: "Delivered", cancelled: "Cancelled" };

export default function OrdersPage() {
  const { sessionId } = useGuestSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadOrders = () => {
    api.get("/api/orders/customer", { params: { sessionId } })
      .then((res) => setOrders(res.data))
      .catch(() => toast.error("Couldn't load your orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [sessionId]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on("order:created", (payload) => {
      if (payload.order?.guest_session_id === sessionId) loadOrders();
    });
    socket.on("order:updated", (order) => {
      if (order.guest_session_id === sessionId) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)));
      }
    });
    return () => socket.disconnect();
  }, [sessionId]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await api.patch(`/api/orders/customer/${cancelTarget}/cancel`, { sessionId });
      setOrders((prev) => prev.map((o) => (o.id === cancelTarget ? { ...o, status: "cancelled" } : o)));
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't cancel order");
    } finally {
      setCancelTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-5 py-4">
        <h1 className="text-lg font-black text-stone-900 flex items-center gap-2">
          <Receipt size={20} className="text-orange-500" /> Your Orders
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 mt-5">
        {loading && <p className="text-stone-400 text-sm">Loading…</p>}
        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <Clock size={28} className="text-orange-300 mx-auto mb-2" />
            <p className="text-stone-400 text-sm">No orders yet.</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
          {orders.map((o) => (
            <div key={o.id} className="p-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-bold text-stone-900">{o.receipt_number || `Order #${o.id}`}</p>
                <p className="text-xs text-stone-400">{new Date(o.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-bold text-stone-900">KES {Number(o.subtotal).toLocaleString()}</p>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_STYLE[o.status] || "bg-stone-100 text-stone-600"}`}>
                  {STATUS_LABEL[o.status] || o.status}
                </span>
                {o.status === "pending" && (
                  <button onClick={() => setCancelTarget(o.id)} className="block text-xs text-red-600 font-semibold ml-auto">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-bold text-stone-900 mb-2">Cancel Order?</h3>
            <p className="text-sm text-stone-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)} className="flex-1 border border-stone-300 rounded-lg py-2 font-semibold">No</button>
              <button onClick={handleConfirmCancel} className="flex-1 bg-red-600 text-white rounded-lg py-2 font-semibold">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}