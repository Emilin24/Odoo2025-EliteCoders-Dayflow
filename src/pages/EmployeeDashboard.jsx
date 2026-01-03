import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Calendar, Clock, LogOut, User, DollarSign, List, Info } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

export default function EmployeeDashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)

    // Data States
    const [attendance, setAttendance] = useState(null) // Today's attendance
    const [attendanceHistory, setAttendanceHistory] = useState([])
    const [payroll, setPayroll] = useState([])
    const [leaveRequests, setLeaveRequests] = useState([])

    // Form States
    const [leaveRequest, setLeaveRequest] = useState({
        startDate: '',
        endDate: '',
        reason: ''
    })

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                fetchData(user.id)
            } else {
                navigate('/login')
            }
        }
        getUser()
    }, [])

    const fetchData = async (userId) => {
        const today = new Date().toISOString().split('T')[0]

        // 1. Today's Attendance
        const { data: todayAtt } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single()

        if (todayAtt) setAttendance(todayAtt)

        // 2. Attendance History (Last 10 records)
        const { data: histAtt } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .neq('date', today) // Exclude today from history to avoid dupes in view if desired, or keep all
            .order('date', { ascending: false })
            .limit(10)

        if (histAtt) setAttendanceHistory(histAtt)

        // 3. Payroll History
        const { data: payData } = await supabase
            .from('payroll')
            .select('*')
            .eq('user_id', userId)
            .order('pay_date', { ascending: false })

        if (payData) setPayroll(payData)

        // 4. Leave Request History
        const { data: leaveData } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (leaveData) setLeaveRequests(leaveData)
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

            // Refresh local state to show 'Checked Out' UI immediately
            const { data: updatedAtt } = await supabase
                .from('attendance')
                .select('*')
                .eq('id', attendance.id)
                .single()

            setAttendance(updatedAtt)
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
            fetchData(user.id) // Refresh list
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

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">

                {/* TOP ROW: ATTENDANCE ACTION & APPLY LEAVE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 1. Today's Attendance Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg flex flex-col h-full">
                        <div className="px-4 py-5 sm:p-6 flex-1 flex flex-col justify-center">
                            <div className="flex items-center mb-4">
                                <Clock className="h-6 w-6 text-indigo-500 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Attendance</h3>
                            </div>

                            <div className="text-center py-4">
                                <p className="text-sm text-gray-500 mb-2">
                                    {attendance?.check_in
                                        ? `Checked in at: ${new Date(attendance.check_in).toLocaleTimeString()}`
                                        : "You haven't checked in today."}
                                </p>
                                {attendance?.check_out && (
                                    <p className="text-sm text-gray-500 mb-4">
                                        Checked out at: {new Date(attendance.check_out).toLocaleTimeString()}
                                    </p>
                                )}

                                <div className="mt-4">
                                    {!attendance ? (
                                        <button
                                            onClick={handleCheckIn}
                                            disabled={loading}
                                            className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Check In Now
                                        </button>
                                    ) : !attendance.check_out ? (
                                        <button
                                            onClick={handleCheckOut}
                                            disabled={loading}
                                            className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Check Out Now
                                        </button>
                                    ) : (
                                        <div className="w-full py-2 bg-green-50 text-green-700 rounded-md border border-green-200 font-medium">
                                            Attendance Complete for Today
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Apply for Leave Card */}
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
                                        rows={2}
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

                {/* BOTTOM ROW: HISTORY SECTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 3. Leave History */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center mb-4">
                                <List className="h-6 w-6 text-indigo-500 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Leave History</h3>
                            </div>
                            <div className="flow-root max-h-60 overflow-y-auto">
                                <ul className="divide-y divide-gray-200">
                                    {leaveRequests.map((req) => (
                                        <li key={req.id} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900 truncate">{req.reason}</p>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                        req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <p className="text-xs text-gray-500">{req.start_date} - {req.end_date}</p>
                                            </div>
                                            {req.admin_comment && (
                                                <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600 border border-gray-100">
                                                    <span className="font-semibold text-indigo-600">HR Comment:</span> {req.admin_comment}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                    {leaveRequests.length === 0 && (
                                        <li className="py-3 text-sm text-gray-500 text-center">No leave requests found.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 4. Attendance History */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center mb-4">
                                <Clock className="h-6 w-6 text-indigo-500 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance History <span className="text-gray-400 text-sm font-normal">(Last 10 Days)</span></h3>
                            </div>
                            <div className="flow-root max-h-60 overflow-y-auto">
                                <ul className="divide-y divide-gray-200">
                                    {attendanceHistory.map((att) => (
                                        <li key={att.id} className="py-3 flex justify-between items-center text-sm">
                                            <div className="text-gray-900 font-medium">{new Date(att.date).toLocaleDateString()}</div>
                                            <div className="text-gray-500">
                                                {new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {att.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ' Active'}
                                            </div>
                                        </li>
                                    ))}
                                    {attendanceHistory.length === 0 && (
                                        <li className="py-3 text-sm text-gray-500 text-center">No past attendance records found.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Payroll History - Full Width */}
                <div className="bg-white overflow-hidden shadow rounded-lg mt-6">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center mb-4">
                            <DollarSign className="h-6 w-6 text-indigo-500 mr-2" />
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Payroll History</h3>
                        </div>
                        <div className="border-t border-gray-200">
                            <ul className="divide-y divide-gray-200">
                                {payroll.map((record) => (
                                    <li key={record.id} className="py-3 flex justify-between">
                                        <span className="text-gray-900 font-medium">${record.salary_amount}</span>
                                        <span className="text-gray-500">{new Date(record.pay_date).toLocaleDateString()}</span>
                                    </li>
                                ))}
                                {payroll.length === 0 && (
                                    <li className="py-3 text-sm text-gray-500">No payment history available.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}
