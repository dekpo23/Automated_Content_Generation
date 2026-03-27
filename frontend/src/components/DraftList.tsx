"use client";

import { useEffect, useState } from "react";
import DraftCard, { Draft } from "./DraftCard";

interface DraftListProps {
    sessionId: string;
}

export default function DraftList({ sessionId }: DraftListProps) {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [localSessionId, setLocalSessionId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [confirmingApprovalId, setConfirmingApprovalId] = useState<string | null>(null);
    const [approvedDraftId, setApprovedDraftId] = useState<string | null>(null);
    const [isApprovingGlobal, setIsApprovingGlobal] = useState(false);

    useEffect(() => {
        if (!sessionId) return;

        let interval: NodeJS.Timeout;

        const fetchDrafts = async () => {
            try {
                const response = await fetch(`/api/drafts?session_id=${sessionId}`);

                if (!response.ok) {
                    throw new Error("Local UI Check: Expected pending workflows, API returned null or error states.");
                }

                const data = await response.json();

                let fetchedDrafts = [];
                let returnedSessionId = sessionId;

                if (Array.isArray(data)) {
                    fetchedDrafts = data;
                } else if (data && data.drafts) {
                    fetchedDrafts = data.drafts;
                    returnedSessionId = data.sessionId || data.Session_ID || sessionId;
                } else if (data && data.Session_ID) {
                    returnedSessionId = data.Session_ID;
                    fetchedDrafts = data.drafts || [];
                }

                // If we have our drafts, stop polling
                if (fetchedDrafts.length >= 3) {
                    setDrafts(fetchedDrafts);
                    setLocalSessionId(returnedSessionId);
                    setLoading(false);
                    clearInterval(interval);
                } else {
                    // Start or continue loading state while waiting for 3 drafts
                    setLoading(true);
                }
            } catch (error: any) {
                console.error(error);
            }
        };

        setLoading(true);
        setDrafts([]);
        fetchDrafts();
        interval = setInterval(fetchDrafts, 3000);

        return () => clearInterval(interval);
    }, [sessionId]);

    const handleApproved = () => {
        setDrafts([]);
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-[1200px] mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[600px] bg-slate-200 animate-pulse rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (drafts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review Generated Drafts</h2>
                    {localSessionId && localSessionId !== "UNKNOWN_SESSION" && <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded ml-2 shadow-sm">Session: {localSessionId}</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {drafts.map((draft) => (
                    <div 
                        key={draft.id}
                        className={`transition-all duration-300 ${approvedDraftId && approvedDraftId !== draft.id ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                    >
                        <DraftCard
                            draft={draft}
                            sessionId={localSessionId}
                            onApproved={() => setApprovedDraftId(draft.id)}
                            confirmingApprovalId={confirmingApprovalId}
                            setConfirmingApprovalId={setConfirmingApprovalId}
                            isApproving={isApprovingGlobal}
                            setIsApproving={setIsApprovingGlobal}
                            isApproved={approvedDraftId === draft.id}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
