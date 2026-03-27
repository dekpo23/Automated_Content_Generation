"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2, ArrowLeft, Filter, Database, FileText, X } from "lucide-react";
import toast from "react-hot-toast";

interface DraftRecord {
    id: string;
    title: string;
    angle?: string;
    status: string;
    input_type: string;
    created_at: string;
    body?: string;
}

export default function DashboardPage() {
    const [drafts, setDrafts] = useState<DraftRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [type, setType] = useState("");
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Modal state
    const [selectedDraft, setSelectedDraft] = useState<DraftRecord | null>(null);
    const [editedBody, setEditedBody] = useState("");
    const [isApproving, setIsApproving] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchDrafts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append("search", debouncedSearch);
            if (type) params.append("type", type);
            if (status) params.append("status", status);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const response = await fetch(`/api/drafts?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch drafts");

            const data = await response.json();
            setDrafts(data);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to load drafts. Is DATABASE_URL set?");
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, type, status, startDate, endDate]);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    const handleSaveEdit = async () => {
        if (!selectedDraft) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch('/api/drafts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedDraft.id, body: editedBody })
            });

            if (!res.ok) throw new Error("Save failed");

            toast.success("Draft edits saved successfully!");
            fetchDrafts();
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to save draft edits.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedDraft) return;
        setIsApproving(true);
        try {
            const res = await fetch('/api/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draft_id: selectedDraft.id, draft_body: editedBody, publishNow: false })
            });
            if (!res.ok) throw new Error("Approval failed");

            toast.success("Draft approved and sent to social workflow!");
            setSelectedDraft(null);
            fetchDrafts();
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to approve draft.");
        } finally {
            setIsApproving(false);
        }
    };

    const openModal = (draft: DraftRecord) => {
        setSelectedDraft(draft);
        setEditedBody(draft.body || "");
    };

    const closeModal = () => {
        if (!isApproving && !isSavingEdit) {
            setSelectedDraft(null);
        }
    };

    return (
        <main className="min-h-screen p-6 sm:p-10 lg:p-16 text-slate-900 dark:text-slate-100 font-sans relative">
            {/* Background elements to match global layout aesthetics */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-slate-50 dark:bg-[#060913] overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 h-[600px] w-full bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl opacity-60 dark:opacity-30 mix-blend-screen transform -translate-y-1/2"></div>
            </div>

            <div className="max-w-[1400px] mx-auto animate-fade-in-up">
                {/* Header */}
                <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Generator
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Content Review Dashboard
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Manage and review drafts successfully saved in the PostgreSQL database.
                        </p>
                    </div>
                </header>

                {/* Control Panel */}
                <div className="bg-white dark:bg-[#151921] border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative min-w-[200px]">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Type Dropdown */}
                        <div className="w-full lg:w-48 shrink-0">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Type</label>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer dark:text-white"
                                >
                                    <option value="">All Types</option>
                                    <option value="blog">Blog Post</option>
                                    <option value="social">Social Media</option>
                                    <option value="email">Email Campaign</option>
                                </select>
                            </div>
                        </div>

                        {/* Status Dropdown */}
                        <div className="w-full lg:w-48 shrink-0">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
                            <div className="relative">
                                <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer dark:text-white"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="draft">Draft</option>
                                    <option value="approved">Approved</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        {/* Date Range Inputs */}
                        <div className="w-full xl:w-auto shrink-0">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Date Range</label>
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                />
                                <span className="text-slate-400 hidden sm:block">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Display */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/50 dark:bg-[#151921]/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse">Fetching from PostgreSQL...</p>
                    </div>
                ) : drafts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/50 dark:bg-[#151921]/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl">
                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-semibold">No drafts found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your filters to find what you're looking for.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#151921] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Content Title</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Generated On</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {drafts.map((draft) => (
                                        <tr key={draft.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-1">{draft.title}</div>
                                                {draft.angle && <div className="text-xs text-slate-500 truncate max-w-md">{draft.angle}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 capitalize">
                                                {draft.input_type || "Unknown"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${draft.status === 'published' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                                                    draft.status === 'approved' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400' :
                                                        draft.status === 'archived' ? 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400' :
                                                            'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                                                    }`}>
                                                    {draft.status || "Draft"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(draft.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openModal(draft)}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4 transition-colors">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
                    <div className="bg-white dark:bg-[#151921] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative">
                        <button
                            onClick={closeModal}
                            disabled={isApproving}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 pr-8">{selectedDraft.title}</h2>

                        <div className="flex items-center gap-3 mb-6">
                            {selectedDraft.angle && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    {selectedDraft.angle}
                                </span>
                            )}
                            <span className="text-sm text-slate-500 font-medium capitalize border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full">
                                {selectedDraft.status}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar pr-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Draft Body (Editable)</label>
                            <textarea
                                value={editedBody}
                                onChange={(e) => setEditedBody(e.target.value)}
                                className="w-full h-72 lg:h-96 p-4 text-sm bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y text-slate-800 dark:text-slate-200 font-medium leading-relaxed"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <button
                                onClick={closeModal}
                                disabled={isApproving || isSavingEdit}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isApproving || isSavingEdit}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg flex items-center justify-center min-w-[140px] transition-colors disabled:opacity-70 shadow-sm"
                            >
                                {isSavingEdit ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : "Save Edits"}
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isApproving || isSavingEdit}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center min-w-[200px] transition-colors disabled:opacity-70 shadow-sm"
                            >
                                {isApproving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Approving & Sending...
                                    </>
                                ) : "Approve & Generate Socials"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
