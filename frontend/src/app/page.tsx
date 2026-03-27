"use client";

import { useState } from "react";
import Link from "next/link";
import ContentForm from "@/components/ContentForm";
import DraftList from "@/components/DraftList";

export default function DashboardPage() {
    const [sessionId, setSessionId] = useState<string>("");

    const handleDraftsGenerated = (newSessionId: string) => {
        setSessionId(newSessionId);
    };

    return (
        <main className="min-h-screen p-6 sm:p-10 lg:p-16 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 relative">
            <div className="absolute top-6 right-6 sm:top-10 sm:right-10 z-10 animate-fade-in-up">
                <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                    Review Dashboard
                    <span className="text-slate-400">→</span>
                </Link>
            </div>
            <div className="fixed inset-0 -z-10 h-full w-full bg-slate-50 dark:bg-[#060913] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[600px] w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl opacity-60 dark:opacity-30 mix-blend-screen pointer-events-none rounded-full transform -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 h-[600px] w-[600px] bg-gradient-to-tl from-cyan-500/10 to-transparent blur-3xl opacity-60 dark:opacity-20 mix-blend-screen pointer-events-none rounded-full transform translate-y-1/3 translate-x-1/4"></div>
            </div>

            <div className="max-w-[1300px] mx-auto tracking-tight animate-fade-in-up">
                <header className="mb-14 text-center flex flex-col items-center">
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-sm font-bold tracking-wide mb-6 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        AI Content Pipeline
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-5">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-[length:200%_auto] animate-[pulse_4s_ease-in-out_infinite]">
                            Content Automation
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl text-center leading-relaxed">
                        Intelligently draft, adapt, and orchestrate automated publishing workflows securely via your internal n8n framework.
                    </p>
                </header>

                <ContentForm onDraftsGenerated={handleDraftsGenerated} />

                <DraftList sessionId={sessionId} />
            </div>
        </main>
    );
}
