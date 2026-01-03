import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Users, FileText, LogOut, CheckCircle, XCircle, DollarSign, CreditCard, Edit, Save, X } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

export default function HRDashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('employees')
    const [employees, setEmployees] = useState([])
    const [leaveRequests, setLeaveRequests] = useState([])
    const [payrollHistory, setPayrollHistory] = useState([])

    // Employee Edit Modal State
    const [editingEmp, setEditingEmp] = useState(null)
    const [editForm, setEditForm] = useState({})

    // Leave Action State
    const [leaveComment, setLeaveComment] = useState('')
    const [activeLeaveId, setActiveLeaveId] = useState(null)

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
                .order('created_at', { ascending: false })

            if (empData) setEmployees(empData)

            // Fetch Leave Requests
            const { data: leaveData } = await supabase
                .from('leave_requests')
                .select('*, profiles(full_name, employee_id)')
                .order('created_at', { ascending: false })

            if (leaveData) setLeaveRequests(leaveData)

            // Fetch Payroll History
            const { data: payData } = await supabase
                .from('payroll')
                .select('*, profiles(full_name, employee_id)')
                .order('pay_date', { ascending: false })

            if (payData) setPayrollHistory(payData)

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    // --- Employee Management ---

    const openEditModal = (emp) => {
        setEditingEmp(emp)
        setEditForm({
            department: emp.department || '',
            designation: emp.designation || '',
            joining_date: emp.joining_date || '',
            base_salary: emp.base_salary || 0
        })
    }

    const handleUpdateEmployee = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('profiles')
                .update(editForm)
                .eq('id', editingEmp.id)

            if (error) throw error

            alert('Employee updated successfully')
            setEditingEmp(null)
            fetchData()

        } catch (error) {
            alert('Error updating employee: ' + error.message)
        }
    }

    // --- Leave Management ---

    const handleLeaveAction = async (id, status) => {
        try {
            const { error } = await supabase
                .from('leave_requests')
                .update({
                    status,
                    admin_comment: leaveComment
                })
                .eq('id', id)

            if (error) throw error

            setLeaveComment('')
            setActiveLeaveId(null)
            fetchData()

        } catch (error) {
            alert('Error updating request: ' + error.message)
        }
    }

    // --- Payroll ---

    const processPayroll = async (userId, amount) => {
        if (!amount || amount <= 0) {
            alert('Please set a valid base salary first.')
            return
        }
        try {
            const { error } = await supabase
                .from('payroll')
                .insert([{
                    user_id: userId,
                    salary_amount: amount,
                    status: 'Paid',
                    pay_date: new Date().toISOString()
                }])

            if (error) throw error
            alert('Payroll processed successfully')
            fetchData()
        } catch (error) {
            alert('Error processing payroll: ' + error.message)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 relative">
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
                        {['employees', 'leaves', 'payroll'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${activeTab === tab
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center capitalize`}
                            >
                                {tab === 'employees' && <Users className="mr-2 h-5 w-5" />}
                                {tab === 'leaves' && <FileText className="mr-2 h-5 w-5" />}
                                {tab === 'payroll' && <DollarSign className="mr-2 h-5 w-5" />}
                                {tab === 'leaves' ? 'Leave Requests' : tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <>
                        {/* EMPLOYEES TAB */}
                        {activeTab === 'employees' && (
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Employee List</h3>
                                </div>
                                <div className="border-t border-gray-200 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept / Desig</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {employees.map((emp) => (
                                                <tr key={emp.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{emp.full_name}</div>
                                                        <div className="text-sm text-gray-500">{emp.employee_id}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.role}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{emp.department || '-'}</div>
                                                        <div className="text-sm text-gray-500">{emp.designation || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {emp.joining_date || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => openEditModal(emp)}
                                                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {employees.length === 0 && (
                                                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No employees found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* LEAVES TAB */}
                        {activeTab === 'leaves' && (
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Leave Requests</h3>
                                </div>
                                <ul className="divide-y divide-gray-200">
                                    {leaveRequests.map((request) => (
                                        <li key={request.id} className="p-4 block hover:bg-gray-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-sm font-medium text-indigo-600">
                                                        {request.profiles?.full_name} ({request.profiles?.employee_id})
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        <span className='font-semibold'>Reason:</span> {request.reason}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {request.start_date} to {request.end_date}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                            request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {request.status === 'Pending' ? (
                                                <div className="mt-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Add Comment (Optional)</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                            placeholder="Reason for rejection or approval note..."
                                                            value={activeLeaveId === request.id ? leaveComment : ''}
                                                            onChange={(e) => {
                                                                setActiveLeaveId(request.id)
                                                                setLeaveComment(e.target.value)
                                                            }}
                                                            onFocus={() => setActiveLeaveId(request.id)}
                                                        />
                                                        <button
                                                            onClick={() => handleLeaveAction(request.id, 'Approved')}
                                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleLeaveAction(request.id, 'Rejected')}
                                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                request.admin_comment && (
                                                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                                                        <span className="font-semibold">HR Comment:</span> {request.admin_comment}
                                                    </p>
                                                )
                                            )}
                                        </li>
                                    ))}
                                    {leaveRequests.length === 0 && (
                                        <li className="p-4 text-center text-gray-500 text-sm">No leave requests found</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* PAYROLL TAB - Keeping simplified as requested, essentially read-only or quick process */}
                        {activeTab === 'payroll' && (
                            <div className="space-y-6">
                                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-4 py-5 sm:px-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Process Payroll</h3>
                                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Quickly process monthly payments based on set Base Salary.</p>
                                    </div>
                                    <div className="border-t border-gray-200 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {employees.map((emp) => (
                                                    <tr key={emp.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {emp.full_name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            ${emp.base_salary || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <button
                                                                onClick={() => processPayroll(emp.id, emp.base_salary)}
                                                                disabled={!emp.base_salary || emp.base_salary <= 0}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                                            >
                                                                <CreditCard className="h-4 w-4 mr-1" /> Pay Now
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-4 py-5 sm:px-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Payment History</h3>
                                    </div>
                                    <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                        {payrollHistory.map((record) => (
                                            <li key={record.id} className="p-4 flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium text-indigo-600">{record.profiles?.full_name}</span>
                                                    <span className="text-gray-500 ml-2">received ${record.salary_amount}</span>
                                                </div>
                                                <span className="text-gray-400 text-sm">{new Date(record.pay_date).toLocaleDateString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* EDIT EMPLOYEE MODAL */}
            {editingEmp && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Edit Employee: {editingEmp.full_name}</h3>
                            <button onClick={() => setEditingEmp(null)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Department</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editForm.department}
                                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Designation</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editForm.designation}
                                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editForm.joining_date}
                                    onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Base Salary ($)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editForm.base_salary}
                                    onChange={(e) => setEditForm({ ...editForm, base_salary: e.target.value })}
                                />
                            </div>
                            <div className="mt-5 sm:mt-6">
                                <button
                                    type="submit"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
