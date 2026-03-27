"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

interface DraftRecord {
    id: string;
    title: string;
    angle?: string;
    body?: string;
}

interface ContentFormProps {
    onDraftsGenerated: (sessionId: string) => void;
}

export default function ContentForm({ onDraftsGenerated }: ContentFormProps) {
    // Existing State
    const [type, setType] = useState<"TEXT" | "URL">("TEXT");
    const [content, setContent] = useState("");

    // Phase 2.5 State additions
    const [isGenerating, setIsGenerating] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [generatedDrafts, setGeneratedDrafts] = useState<DraftRecord[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsGenerating(true);
        setGeneratedDrafts([]);

        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);

        try {
            // --- INJECTED GATEKEEPER ---
            let finalContentForN8n = content; // Fallback to raw input
            try {
                const dedupPayload = {
                    url: type === "URL" ? content.trim() : `idea-${newSessionId}`,
                    raw_text: type === "TEXT" ? content : null
                };

                const dedupRes = await fetch("http://localhost:8000/process-idea", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dedupPayload)
                });

                if (dedupRes.ok) {
                    const dedupData = await dedupRes.json();
                    if (dedupData.status === "rejected") {
                        setIsGenerating(false);
                        toast.error(`Duplicate content detected! (Distance: ${dedupData.distance?.toFixed(2) || "unknown"})`);
                        return; // Halt submission to n8n
                    }
                    if (dedupData.status === "accepted" && dedupData.content_to_use) {
                        finalContentForN8n = dedupData.content_to_use;
                    }
                } else {
                    console.warn("Deduper service returned an error status. Proceeding to n8n fallback...");
                }
            } catch (dedupError) {
                console.warn("Deduper service unavailable. Proceeding to n8n fallback...", dedupError);
            }
            // --- END GATEKEEPER ---

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "TEXT", // Force to TEXT so n8n never tries to scrape
                    content: finalContentForN8n, // Pass the Python-summarized text
                    source_url: type === "URL" ? content.trim() : null, // The original link
                    sessionId: newSessionId
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || `HTTP error ${response.status}`);
            }

            const data = await response.json();
            
            if (data && data.success === false) {
                 throw new Error(data.message || "Failed to generate drafts.");
            }

            setContent("");
            onDraftsGenerated(newSessionId);
            toast.success(data.message || "Success! Your drafts are ready to review.");

        } catch (error: any) {
            console.error(error);
            if (error.name === 'TypeError' || error.message === 'Failed to fetch' || (error.message && error.message.includes('timeout'))) {
                toast.error("Request timed out. The AI might still be thinking in the background, or the connection dropped.");
            } else {
                toast.error(error.message || "Failed to connect to n8n Webhook.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* EXISTING INPUT FORM UI (Preserved entirely) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Input Type
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-64">
                            <button
                                type="button"
                                onClick={() => setType("TEXT")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === "TEXT"
                                    ? "bg-white shadow-sm text-slate-900"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                Text
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("URL")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === "URL"
                                    ? "bg-white shadow-sm text-slate-900"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                URL
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {type === "TEXT" ? "Content Idea or Prompt" : "Target URL"}
                        </label>
                        {type === "TEXT" ? (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-y placeholder:text-slate-400 text-slate-900"
                                placeholder="e.g. Write a technical deep dive about Next.js API Routes..."
                            />
                        ) : (
                            <input
                                type="url"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                placeholder="https://example.com/source-article"
                            />
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isGenerating || !content.trim()}
                        className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Drafts
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* TASK 2: ADDITIVE UI (Strictly below form) */}

            {/* Polling Spinner */}
            {isGenerating && (
                <div className="flex flex-col items-center justify-center py-16 px-6 bg-white/60 dark:bg-[#151921]/60 border border-slate-200 dark:border-slate-800 rounded-xl backdrop-blur-sm animate-pulse shadow-sm min-h-[250px]">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 dark:opacity-40 animate-pulse"></div>
                        <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
                    </div>
                    <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-center mb-2">
                        Cooking up some brilliant drafts.
                    </p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center px-4">
                        Grab a sip of coffee... This usually takes about 30 seconds.
                    </p>
                </div>
            )}

        </div>
    );
}
