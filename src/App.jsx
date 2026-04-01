import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import TrackingCapture from "./pages/TrackingCapture";
import TermsAndConditions from "./pages/TermsAndConditions";
import ResetPassword from "./pages/ResetPassword";
import PixelTracker from "./pages/PixelTracker";
import EmailSender from "./pages/EmailSender";

function WithNavbar({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/t/:token" element={<TrackingCapture />} />
          <Route path="/" element={<WithNavbar><Home /></WithNavbar>} />
          <Route path="/login" element={<WithNavbar><Login /></WithNavbar>} />
          <Route path="/signup" element={<WithNavbar><Signup /></WithNavbar>} />
          <Route path="/about" element={<WithNavbar><About /></WithNavbar>} />
          <Route path="/contact" element={<WithNavbar><Contact /></WithNavbar>} />
          <Route path="/terms" element={<WithNavbar><TermsAndConditions /></WithNavbar>} />
          <Route path="/reset-password" element={<WithNavbar><ResetPassword /></WithNavbar>} />
          <Route path="/email-sender" element={<WithNavbar><ProtectedRoute><EmailSender /></ProtectedRoute></WithNavbar>} />
          <Route path="/pixels" element={<WithNavbar><ProtectedRoute><PixelTracker /></ProtectedRoute></WithNavbar>} />
          <Route path="/dashboard" element={<WithNavbar><ProtectedRoute><Dashboard /></ProtectedRoute></WithNavbar>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}


