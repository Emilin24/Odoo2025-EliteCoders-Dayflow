import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import EmployeeDashboard from './pages/EmployeeDashboard'
import HRDashboard from './pages/HRDashboard'
import Profile from './pages/Profile'

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                    <Route path="/hr-dashboard" element={<HRDashboard />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
