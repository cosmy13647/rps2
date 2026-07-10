import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CashierPage from './pages/CashierPage';
import WaiterPage from './pages/WaiterPage';
import KitchenPage from './pages/KitchenPage';

function PrivateRoute({ children }) {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function PublicRoute({ children }) {
    const token = localStorage.getItem("token");
    if (token) return <Navigate to="/dashboard" replace />;
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><CashierPage /></PrivateRoute>} />
                <Route path="/waiter" element={<PrivateRoute><WaiterPage /></PrivateRoute>} />
                <Route path="/kitchen" element={<PrivateRoute><KitchenPage /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}