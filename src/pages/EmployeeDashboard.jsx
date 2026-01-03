import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Calendar, Clock, LogOut, User } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

export default function EmployeeDashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [attendance, setAttendance] = useState(null)
    const [leaveRequest, setLeaveRequest] = useState({
        startDate: '',
        endDate: '',
        reason: ''
    })
    const [user, setUser] = useState(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                fetchAttendance(user.id)
            } else {
                navigate('/login')
            }
        }
        getUser()
    }, [])

    const fetchAttendance = async (userId) => {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single()

        if (data) setAttendance(data)
    }

    const handleCheckIn = async () => {
        if (!user) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('attendance')
                .insert([
                    { user_id: user.id, check_in: new Date().toISOString() }
                ])
                .select()
                .single()

            if (error) throw error
            setAttendance(data)
            alert('Checked in successfully!')
        } catch (error) {
            console.error('Error checking in:', error)
            alert('Error checking in')
        } finally {
            setLoading(false)
        }
    }

    const handleCheckOut = async () => {
        if (!user || !attendance) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('attendance')
                .update({ check_out: new Date().toISOString() })
                .eq('id', attendance.id)

            if (error) throw error
            // Refresh
            fetchAttendance(user.id)
            alert('Checked out successfully!')
        } catch (error) {
            console.error('Error checking out:', error)
            alert('Error checking out')
        } finally {
            setLoading(false)
        }
    }

    const handleLeaveSubmit = async (e) => {
        e.preventDefault()
        if (!user) return

        try {
            const { error } = await supabase
                .from('leave_requests')
                .insert([
                    {
                        user_id: user.id,
                        start_date: leaveRequest.startDate,
                        end_date: leaveRequest.endDate,
                        reason: leaveRequest.reason
                    }
                ])

            if (error) throw error
            alert('Leave request submitted!')
            setLeaveRequest({ startDate: '', endDate: '', reason: '' })
        } catch (error) {
            alert('Error submitting leave request: ' + error.message)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-600">Dayflow</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/profile" className="text-gray-600 hover:text-indigo-600">
                                <User className="h-6 w-6" />
                            </Link>
                            <button onClick={handleLogout} className="text-gray-600 hover:text-indigo-600">
                                <LogOut className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Attendance Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center mb-4">
                                <Clock className="h-6 w-6 text-indigo-500 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                {attendance?.check_in
                                    ? `Checked in at: ${new Date(attendance.check_in).toLocaleTimeString()}`
                                    : "You haven't checked in today."}
                            </p>
                            {attendance?.check_out && (
                                <p className="text-sm text-gray-500 mb-4">
                                    Checked out at: {new Date(attendance.check_out).toLocaleTimeString()}
                                </p>
                            )}

                            <div className="mt-2">
                                {!attendance ? (
                                    <button
                                        onClick={handleCheckIn}
                                        disabled={loading}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Check In
                                    </button>
                                ) : !attendance.check_out ? (
                                    <button
                                        onClick={handleCheckOut}
                                        disabled={loading}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Check Out
                                    </button>
                                ) : (
                                    <div className="text-center text-green-600 font-medium">Attendance Complete</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Leave Application Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center mb-4">
                                <Calendar className="h-6 w-6 text-indigo-500 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Apply for Leave</h3>
                            </div>
                            <form onSubmit={handleLeaveSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            value={leaveRequest.startDate}
                                            onChange={(e) => setLeaveRequest({ ...leaveRequest, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            value={leaveRequest.endDate}
                                            onChange={(e) => setLeaveRequest({ ...leaveRequest, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Reason</label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        placeholder="Sick leave, Vacation, etc."
                                        value={leaveRequest.reason}
                                        onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Submit Request
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
