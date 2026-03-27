"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { Loader2, Send, Pencil } from "lucide-react";

export interface Draft {
    id: string;
    angle: string;
    title: string;
    body: string;
}

interface DraftCardProps {
    draft: Draft;
    sessionId: string;
    onApproved: () => void;
    confirmingApprovalId?: string | null;
    setConfirmingApprovalId?: (id: string | null) => void;
    isApproving?: boolean;
    setIsApproving?: (val: boolean) => void;
    isApproved?: boolean;
}

export default function DraftCard({ 
    draft, 
    sessionId, 
    onApproved,
    confirmingApprovalId,
    setConfirmingApprovalId,
    isApproving,
    setIsApproving,
    isApproved
}: DraftCardProps) {
    const [localIsApproving, setLocalIsApproving] = useState(false);
    const actualIsApproving = isApproving ?? localIsApproving;
    const actualSetIsApproving = setIsApproving ?? setLocalIsApproving;

    const [publishNow, setPublishNow] = useState(false);

    // Edit mode states
    const [isEditing, setIsEditing] = useState(false);
    const [editedBody, setEditedBody] = useState("");
    const [currentBody, setCurrentBody] = useState(draft.body);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/drafts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: draft.id, body: editedBody }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || "Failed to save draft");
            }

            toast.success("Draft saved successfully!");
            setCurrentBody(editedBody);
            setIsEditing(false);
        } catch (error: any) {
            console.error(error);
            toast.error(`Save failed: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleApprove = async () => {
        actualSetIsApproving(true);
        try {
            const response = await fetch("/api/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    draft_id: draft.id,
                    draft_body: currentBody,
                    publishNow: publishNow
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || "Failed to approve draft");
            }

            toast.success("Draft approved and sent to publishing pipeline!");
            onApproved();
        } catch (error: any) {
            console.error(error);
            toast.error(`Approval failed: ${error.message}`);
        } finally {
            actualSetIsApproving(false);
            if (setConfirmingApprovalId) setConfirmingApprovalId(null);
        }
    };

    return (
        <article className={`flex flex-col h-[650px] bg-white border ${isApproved ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'} rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md relative overflow-hidden`}>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl shrink-0">
                <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
                        {draft.angle}
                    </span>
                    <div className="flex items-center gap-2">
                        {isApproved && (
                            <span className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded border border-emerald-200 uppercase tracking-wider">
                                Approved
                            </span>
                        )}
                        {!isEditing && !isApproved && (
                            <button
                                onClick={() => {
                                    setEditedBody(currentBody);
                                    setIsEditing(true);
                                }}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                title="Edit inline"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                        <span className="text-xs text-slate-400 font-mono ml-1">
                            #{draft.id.slice(0, 6)}
                        </span>
                    </div>
                </div>
                <h2 className="text-lg font-bold leading-snug text-slate-900 mb-1 line-clamp-2">
                    {draft.title}
                </h2>
            </div>

            {/* Markdown Body or Edit Area */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-grow bg-white flex flex-col">
                {isEditing ? (
                    <div className="flex flex-col h-full flex-grow">
                        <textarea
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 resize-y focus:ring-2 focus:ring-indigo-500 focus:outline-none flex-grow custom-scrollbar"
                            placeholder="Edit your draft here..."
                            rows={8}
                        />
                        <div className="flex justify-end gap-2 mt-4 shrink-0">
                            <button
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-3 py-1.5 text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg flex items-center transition-colors disabled:opacity-60"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                                Save Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="prose prose-sm prose-slate max-w-none">
                        <ReactMarkdown>{currentBody}</ReactMarkdown>
                    </div>
                )}
            </div>

            {/* Footer / Actions - mt-auto enforces absolute bottom */}
            <div className="mt-auto p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-600">Publish Immediately</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={publishNow}
                            onChange={() => setPublishNow(!publishNow)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                </div>

                {confirmingApprovalId === draft.id ? (
                    <div className="flex items-center gap-3 w-full">
                        <button
                            onClick={() => setConfirmingApprovalId?.(null)}
                            disabled={actualIsApproving}
                            className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={actualIsApproving || isApproved}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {actualIsApproving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Yes, Confirm & Send"
                            )}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmingApprovalId?.(draft.id)}
                        disabled={actualIsApproving || isApproved}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        Approve &amp; Adapt
                    </button>
                )}
            </div>
        </article>
    );
}
