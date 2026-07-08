import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage   from "./pages/LoginPage";
import CashierPage from './pages/CashierPage';
import WaiterPage from './pages/WaiterPage';
import KitchenPage from './pages/KitchenPage';
// ── Auth guard — checks localStorage token ────────────────
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// ── Public route — redirect logged-in users away from login/landing
function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing — redirect to dashboard if already logged in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Cashier */}
        <Route
          path="/cashier"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">🍽️</div>
                  <h1 className="text-2xl font-black mb-2">Dashboard coming soon</h1>
                  <p className="text-gray-500 mb-6">You're logged in successfully.</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/login";
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </PrivateRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
<Route path="/dashboard" element={<PrivateRoute><CashierPage /></PrivateRoute>} />
<Route path="/waiter" element={<PrivateRoute><WaiterPage /></PrivateRoute>} />
<Route path="/kitchen" element={<PrivateRoute><KitchenPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
