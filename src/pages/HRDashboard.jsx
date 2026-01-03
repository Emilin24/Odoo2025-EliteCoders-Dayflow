import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Users, FileText, LogOut, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

export default function HRDashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('employees')
    const [employees, setEmployees] = useState([])
    const [leaveRequests, setLeaveRequests] = useState([])

    useEffect(() => {
        checkUser()
        fetchData()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.user_metadata.role !== 'HR') {
            navigate('/login')
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Employees
            const { data: empData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'Employee')

            if (empData) setEmployees(empData)

            // Fetch Leave Requests
            const { data: leaveData } = await supabase
                .from('leave_requests')
                .select('*, profiles(full_name, employee_id)')
                .order('created_at', { ascending: false })

            if (leaveData) setLeaveRequests(leaveData)

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLeaveAction = async (id, status) => {
        try {
            const { error } = await supabase
                .from('leave_requests')
                .update({ status })
                .eq('id', id)

            if (error) throw error

            // Refresh list
            const { data } = await supabase
                .from('leave_requests')
                .select('*, profiles(full_name, employee_id)')
                .order('created_at', { ascending: false })

            if (data) setLeaveRequests(data)

        } catch (error) {
            alert('Error updating request: ' + error.message)
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
                            <h1 className="text-2xl font-bold text-indigo-800">Dayflow HR</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={handleLogout} className="text-gray-600 hover:text-indigo-800">
                                <LogOut className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('employees')}
                            className={`${activeTab === 'employees'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Users className="mr-2 h-5 w-5" />
                            Employees
                        </button>
                        <button
                            onClick={() => setActiveTab('leaves')}
                            className={`${activeTab === 'leaves'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <FileText className="mr-2 h-5 w-5" />
                            Leave Requests
                        </button>
                    </nav>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'employees' && (
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Employee List</h3>
                                </div>
                                <div className="border-t border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {employees.map((emp) => (
                                                <tr key={emp.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.full_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.employee_id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.role}</td>
                                                </tr>
                                            ))}
                                            {employees.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No employees found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'leaves' && (
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Leave Requests</h3>
                                </div>
                                <ul className="divide-y divide-gray-200">
                                    {leaveRequests.map((request) => (
                                        <li key={request.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                            <div>
                                                <p className="text-sm font-medium text-indigo-600 truncate">
                                                    {request.profiles?.full_name} ({request.profiles?.employee_id})
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {request.reason} <span className="text-gray-400">|</span> {request.start_date} to {request.end_date}
                                                </p>
                                                <p className={`text-xs mt-1 font-semibold ${request.status === 'Approved' ? 'text-green-600' :
                                                        request.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
                                                    }`}>
                                                    Status: {request.status}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                {request.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleLeaveAction(request.id, 'Approved')}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleLeaveAction(request.id, 'Rejected')}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" /> Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                    {leaveRequests.length === 0 && (
                                        <li className="p-4 text-center text-gray-500 text-sm">No leave requests found</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
