import axios from '../utils/axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { IoPerson, IoAt, IoMail, IoLockClosed, IoPersonAdd } from 'react-icons/io5';

const Register = () => {
    const navigate = useNavigate()
    const { setAuthUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [inputData, setInputData] = useState({})

    const handelInput = (e) => {
        setInputData({ ...inputData, [e.target.id]: e.target.value })
    }

    const selectGender = (selectGender) => {
        setInputData((prev) => ({
            ...prev, gender: selectGender === inputData.gender ? '' : selectGender
        }))
    }

    const handelSubmit = async (e) => {
        e.preventDefault();
        if (inputData.password !== inputData.confpassword) {
            return toast.error("Passwords don't match")
        }
        if (!inputData.gender) {
            return toast.error("Please select gender")
        }
        setLoading(true)
        try {
            const register = await axios.post(`/api/auth/register`, inputData);
            const data = register.data;
            if (data.success === false) {
                toast.error(data.message)
                return;
            }
            toast.success("Account created! Welcome to NexChat")
            localStorage.setItem('chatapp', JSON.stringify(data))
            setAuthUser(data)
            navigate('/')
        } catch (error) {
            toast.error(error?.response?.data?.message || "Registration failed")
        } finally {
            setLoading(false)
        }
    }

    const inputClass = 'w-full pl-11 pr-4 py-3 bg-[#0f1720] border border-white/10 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition text-sm';

    return (
        <AuthLayout
            title="Join"
            subtitle="Create your free account"
            footerText="Already have an account?"
            footerLink="/login"
            footerLabel="Sign in"
        >
            <form onSubmit={handelSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Full Name</label>
                        <div className="relative">
                            <IoPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input id='fullname' type='text' onChange={handelInput} placeholder='Arpit Prajapati' required className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Username</label>
                        <div className="relative">
                            <IoAt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input id='username' type='text' onChange={handelInput} placeholder='arpitPrajapati' required className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Email</label>
                        <div className="relative">
                            <IoMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input id='email' type='email' onChange={handelInput} placeholder='name@example.com' required className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Password</label>
                        <div className="relative">
                            <IoLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input id='password' type='password' onChange={handelInput} placeholder='••••••••' required className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="text-slate-300 text-xs font-medium mb-1.5 block">Confirm</label>
                        <div className="relative">
                            <IoLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input id='confpassword' type='password' onChange={handelInput} placeholder='••••••••' required className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-1">
                    {['male', 'female'].map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => selectGender(g)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition capitalize ${inputData.gender === g
                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                : 'bg-[#0f1720] border-white/10 text-slate-400 hover:border-white/20'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                <button
                    type='submit'
                    disabled={loading}
                    className='w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-900/30 mt-2'
                >
                    {loading ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        <>
                            <IoPersonAdd size={20} />
                            Create Account
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    )
}

export default Register
