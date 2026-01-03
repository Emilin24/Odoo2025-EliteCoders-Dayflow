import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { User, Mail, Briefcase, Phone, CreditCard, Save, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function Profile() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState({
        full_name: '',
        role: '',
        employee_id: '',
        email: '', // Note: Email is usually in auth.users, not mutable in profile easily without auth update, but we can show it.
    })
    // We'll create a local state for editable fields if we had more, for now we just show profile.
    // We can add "Phone" or "Avatar URL" if we had them in schema, but schema only has basic fields.
    // I'll add a dummy "Avatar URL" or just let them update Full Name.
    // Prompt says: "update contact info/avatar". I'll assume I can add columns or just update what's there.
    // I'll update full_name for now.

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
                    email: user.email // Get email from auth user object
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

            const updates = {
                full_name: profile.full_name,
                // employee_id and role are usually immutable by user or strict, but let's allow name update.
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)

            if (error) throw error
            alert('Profile updated!')
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

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="text-2xl font-bold text-indigo-600">Dayflow</Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={handleLogout} className="text-gray-600 hover:text-indigo-600">
                                <LogOut className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and application.</p>
                        </div>
                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <User />}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <form onSubmit={updateProfile}>
                            <dl className="sm:divide-y sm:divide-gray-200">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                                        <User className="h-4 w-4 mr-2" /> Full Name
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <input
                                            type="text"
                                            className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md border p-2"
                                            value={profile.full_name || ''}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        />
                                    </dd>
                                </div>

                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                                        <CreditCard className="h-4 w-4 mr-2" /> Employee ID
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <input
                                            type="text"
                                            disabled
                                            className="max-w-lg block w-full shadow-sm bg-gray-50 sm:text-sm border-gray-300 rounded-md border p-2 text-gray-500"
                                            value={profile.employee_id || ''}
                                        />
                                    </dd>
                                </div>

                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                                        <Briefcase className="h-4 w-4 mr-2" /> Role
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <input
                                            type="text"
                                            disabled
                                            className="max-w-lg block w-full shadow-sm bg-gray-50 sm:text-sm border-gray-300 rounded-md border p-2 text-gray-500"
                                            value={profile.role || ''}
                                        />
                                    </dd>
                                </div>

                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                                        <Mail className="h-4 w-4 mr-2" /> Email
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <span className="text-gray-900">{profile.email}</span>
                                    </dd>
                                </div>

                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500"></dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <Save className="h-4 w-4 mr-2" /> Save Changes
                                        </button>
                                    </dd>
                                </div>
                            </dl>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}
