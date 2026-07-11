import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CashierPage from "./pages/CashierPage";
import WaiterPage from "./pages/WaiterPage";
import KitchenPage from "./pages/KitchenPage";
import CustomerPage from "./pages/CustomerPage";
import ordersPage from "./pages/OrdersPage";
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");

  // Redirect logged-in users to the Order page
  if (token) {
    return <Navigate to="/order" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route path="/order" element={<CustomerPage />} />
        <Route path="/orders" element={<ordersPage />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <CashierPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/waiter"
          element={
            <PrivateRoute>
              <WaiterPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <PrivateRoute>
              <KitchenPage />
            </PrivateRoute>
          }
        />

        {/* Redirect unknown routes to the Order page */}
        <Route path="*" element={<Navigate to="/order" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
