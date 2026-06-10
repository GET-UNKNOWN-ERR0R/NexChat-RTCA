import axios from '../utils/axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { IoMail, IoLockClosed, IoLogIn } from 'react-icons/io5';

const Login = () => {
    const navigate = useNavigate();
    const { setAuthUser } = useAuth();
    const [userInput, setUserInput] = useState({});
    const [loading, setLoading] = useState(false)

    const handelInput = (e) => {
        setUserInput({ ...userInput, [e.target.id]: e.target.value })
    }

    const handelSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const login = await axios.post(`/api/auth/login`, userInput);
            const data = login.data;
            if (data.success === false) {
                toast.error(data.message)
                return;
            }
            toast.success(data.message || "Welcome back!")
            localStorage.setItem('chatapp', JSON.stringify(data));
            setAuthUser(data)
            navigate('/')
        } catch (error) {
            toast.error(error?.response?.data?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Welcome to"
            subtitle="Sign in to continue chatting"
            footerText="Don't have an account?"
            footerLink="/register"
            footerLabel="Create one"
        >
            <form onSubmit={handelSubmit} className="space-y-5">
                <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">Email</label>
                    <div className="relative">
                        <IoMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            id='email'
                            type='email'
                            onChange={handelInput}
                            placeholder='name@example.com'
                            required
                            className='w-full pl-11 pr-4 py-3.5 bg-[#0f1720] border border-white/10 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition'
                        />
                    </div>
                </div>

                <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">Password</label>
                    <div className="relative">
                        <IoLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            id='password'
                            type='password'
                            onChange={handelInput}
                            placeholder='••••••••'
                            required
                            className='w-full pl-11 pr-4 py-3.5 bg-[#0f1720] border border-white/10 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition'
                        />
                    </div>
                </div>

                <button
                    type='submit'
                    disabled={loading}
                    className='w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-900/30'
                >
                    {loading ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        <>
                            <IoLogIn size={20} />
                            Sign In
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    )
}

export default Login
