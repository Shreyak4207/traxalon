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
          {/* Tracking link - no navbar */}
          <Route path="/t/:token" element={<TrackingCapture />} />

          {/* All routes with navbar */}
          <Route path="/" element={<WithNavbar><Home /></WithNavbar>} />
          <Route path="/login" element={<WithNavbar><Login /></WithNavbar>} />
          <Route path="/signup" element={<WithNavbar><Signup /></WithNavbar>} />
          <Route path="/about" element={<WithNavbar><About /></WithNavbar>} />
          <Route path="/contact" element={<WithNavbar><Contact /></WithNavbar>} />
          <Route path="/terms" element={<WithNavbar><TermsAndConditions /></WithNavbar>} />
          <Route path="/reset-password" element={<WithNavbar><ResetPassword /></WithNavbar>} />
          <Route
            path="/dashboard"
            element={
              <WithNavbar>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </WithNavbar>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}