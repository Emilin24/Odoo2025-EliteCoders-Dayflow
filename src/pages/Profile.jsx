import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
    User, Mail, Briefcase, Phone, CreditCard, Save, LogOut,
    MapPin, Calendar, FileText, Download
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function Profile() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState({
        full_name: '',
        role: '',
        employee_id: '',
        email: '',
        phone: '',
        address: '',
        department: '',
        designation: '',
        joining_date: '',
        base_salary: 0,
        salary_hra: 0,
        salary_allowances: 0,
        avatar_url: '',
        documents: [] // Array of {name, url}
    })

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                navigate('/login')
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data) {
                setProfile({
                    ...data,
                    email: user.email, // Get email from auth user object
                    // Ensure defaults if null
                    documents: data.documents || [],
                    base_salary: data.base_salary || 0,
                    salary_hra: data.salary_hra || 0,
                    salary_allowances: data.salary_allowances || 0
                })
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('No user')

            // Employees can only edit limited fields
            const updates = {
                full_name: profile.full_name,
                phone: profile.phone,
                address: profile.address,
                avatar_url: profile.avatar_url,
                updated_at: new Date(),
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)

            if (error) throw error
            alert('Profile updated successfully!')
        } catch (error) {
            alert('Error updating profile: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    // Calculate Total Salary
    const totalSalary = (profile.base_salary || 0) + (profile.salary_hra || 0) + (profile.salary_allowances || 0)

    if (loading) return <div className="p-10 text-center">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white shadow sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">Dayflow</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to={profile.role === 'HR' ? "/hr-dashboard" : "/employee-dashboard"} className="text-gray-600 hover:text-indigo-600 font-medium text-sm">
                                Dashboard
                            </Link>
                            <button onClick={handleLogout} className="text-gray-600 hover:text-indigo-600 flex items-center gap-2">
                                <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">

                {/* 1. Header Section */}
                <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <img
                            src={profile.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover border-4 border-indigo-50"
                        />
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{profile.full_name || "New Employee"}</h1>
                        <p className="text-indigo-600 font-medium">{profile.designation || profile.role}</p>
                        <p className="text-gray-500 text-sm flex items-center justify-center md:justify-start gap-1 mt-1">
                            <Briefcase className="w-3 h-3" /> {profile.employee_id}
                        </p>
                    </div>
                </div>

                <form onSubmit={updateProfile} className="space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 2. Personal Details (Editable) */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                <User className="text-indigo-600 w-5 h-5" />
                                <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        value={profile.full_name || ''}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email (Read Only)</label>
                                    <div className="mt-1 flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                                        <Mail className="w-4 h-4" /> {profile.email}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={profile.phone || ''}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            className="block w-full pl-10 border border-gray-300 rounded-md py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="+91 99999 99999"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 pt-2 pointer-events-none">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={profile.address || ''}
                                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                            className="block w-full pl-10 border border-gray-300 rounded-md py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Your residential address"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <Save className="h-4 w-4 mr-2" /> Save Personal Changes
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* 3. Job Details (Read Only) */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                    <Briefcase className="text-indigo-600 w-5 h-5" />
                                    <h2 className="text-lg font-semibold text-gray-900">Job Details</h2>
                                </div>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide">Department</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-medium">{profile.department || 'N/A'}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide">Designation</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-medium">{profile.designation || 'N/A'}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date of Joining</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-medium flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {profile.joining_date || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide">Role</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-medium">{profile.role}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* 4. Salary Structure (Read Only) */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                    <CreditCard className="text-indigo-600 w-5 h-5" />
                                    <h2 className="text-lg font-semibold text-gray-900">Salary Structure</h2>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Basic Pay</span>
                                        <span className="font-medium text-gray-900">₹{profile.base_salary}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">HRA</span>
                                        <span className="font-medium text-gray-900">₹{profile.salary_hra}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Allowances</span>
                                        <span className="font-medium text-gray-900">₹{profile.salary_allowances}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-900">Total Monthly</span>
                                        <span className="text-lg font-bold text-green-600">₹{totalSalary}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Documents */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <FileText className="text-indigo-600 w-5 h-5" />
                            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                        </div>
                        {profile.documents && profile.documents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {profile.documents.map((doc, idx) => (
                                    <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                                    >
                                        <FileText className="h-8 w-8 text-gray-400 group-hover:text-indigo-500" />
                                        <div className="ml-3 flex-1 overflow-hidden">
                                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-500">Click to view</p>
                                        </div>
                                        <Download className="h-4 w-4 text-gray-400" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                                <span className="mt-2 block text-sm font-medium text-gray-500">No documents uploaded</span>
                            </div>
                        )}
                    </div>

                </form>
            </main>
        </div>
    )
}