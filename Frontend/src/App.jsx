import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from './pages/Forgotpassword';
import ResetPassword from './pages/ResetPassword';
import BecomePublisher from "./pages/BecomePublisher";
import PublisherDashboard from "./pages/PublisherDashboard";
import UploadBook from "./pages/UploadBook";
import BookDetail from "./pages/BookDetail";
import BookReader from "./pages/BookReader";
import Store from "./pages/Store";
import Library from "./pages/Library";
import MyBooks from "./pages/MyBooks";
import EditBook from "./pages/EditBook";
import AdminPanel from "./pages/AdminPanel";
import Notifications from "./pages/Notifications";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import Profile from "./pages/Profile";
import PublisherEarnings from "./pages/PublisherEarnings";

function AppContent() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Skip user fetch on admin route
    if (location.pathname.startsWith("/admin")) {
      setLoadingUser(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingUser(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/publisher/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("loggedInUser");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  if (loadingUser) return null;

  return (
    <>
      <ToastContainer position="bottom-right" />
      <Routes>

        {/* ── Public ─────────────────────────────────────────── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Protected (any logged-in user) ─────────────────── */}
        <Route path="/home" element={
          user ? <Home user={user} handleLogout={handleLogout} />
               : <Navigate to="/login" />
        } />
        <Route path="/become-publisher" element={
          user ? <BecomePublisher user={user} token={localStorage.getItem("token")} />
               : <Navigate to="/login" />
        } />

        {/* ── Publisher only ──────────────────────────────────── */}
        <Route path="/publisher-dashboard" element={
          user?.role === "publisher"
            ? <PublisherDashboard user={user} handleLogout={handleLogout} />
            : <Navigate to="/home" />
        } />
        <Route path="/publisher-dashboard/books" element={
          user?.role === "publisher"
            ? <MyBooks user={user} handleLogout={handleLogout} />
            : <Navigate to="/home" />
        } />
        <Route path="/publisher-dashboard/edit/:id" element={
          user?.role === "publisher"
            ? <EditBook user={user} handleLogout={handleLogout} />
            : <Navigate to="/home" />
        } />
        <Route path="/publisher-dashboard/upload" element={
          user?.role === "publisher"
            ? <UploadBook user={user} />
            : <Navigate to="/home" />
        } />

        <Route path="/library" element={
          user ? <Library user={user} handleLogout={handleLogout} />
               : <Navigate to="/login" />
        } />
        <Route path="/store" element={
          user ? <Store user={user} handleLogout={handleLogout} />
               : <Navigate to="/login" />
        } />

        <Route path="/notifications" element={
          user ? <Notifications user={user} handleLogout={handleLogout} />
               : <Navigate to="/login" />
        } />
        <Route path="/profile" element={
          user ? <Profile user={user} setUser={setUser} handleLogout={handleLogout} />
               : <Navigate to="/login" />
        } />

        {/* ── Payment ─────────────────────────────────────────── */}
        <Route path="/payment/success" element={
          user ? <PaymentSuccess user={user} />
               : <Navigate to="/login" />
        } />
        <Route path="/payment/failure" element={<PaymentFailure />} />

        {/* ── Admin ───────────────────────────────────────────── */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* ── Book detail & reader ────────────────────────────── */}
        <Route path="/book/:id" element={
          user ? <BookDetail user={user} handleLogout={handleLogout} />
               : <Navigate to="/login" />
        } />
        <Route path="/book/:id/read" element={
          user ? <BookReader user={user} />
               : <Navigate to="/login" />
        } />

        <Route path="/publisher-dashboard/earnings" element={
          <PublisherEarnings user={user} 
          handleLogout={handleLogout} />} />

        {/* ── Fallback ────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" />} />



      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}