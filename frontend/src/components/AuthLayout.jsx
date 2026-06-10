import React from "react";
import { Link } from "react-router-dom";

const AuthLayout = ({ title, subtitle, children, footerText, footerLink, footerLabel }) => (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#060b10] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-100 h-100 bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
                    <span className="text-3xl">💬</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    {title}
                    <span className="text-emerald-400"> NexChat</span>
                </h1>
                {subtitle && (
                    <p className="text-slate-400 mt-2 text-sm">{subtitle}</p>
                )}
            </div>

            <div className="bg-[#1a2332]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
                {children}
            </div>

            {footerText && footerLink && (
                <p className="text-center text-slate-400 text-sm mt-6">
                    {footerText}{" "}
                    <Link
                        to={footerLink}
                        className="text-emerald-400 font-semibold hover:text-emerald-300 transition"
                    >
                        {footerLabel}
                    </Link>
                </p>
            )}
        </div>
    </div>
);

export default AuthLayout;
