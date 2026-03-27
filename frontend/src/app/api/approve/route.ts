import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const webhookUrl = process.env.N8N_WEBHOOK_URL;

        if (!webhookUrl) {
            return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 });
        }

        const response = await fetch(`${webhookUrl}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`n8n /approve error (${response.status}):`, text);
            return NextResponse.json({ error: `n8n Webhook Error: ${response.status}`, details: text }, { status: response.status });
        }

        const data = await response.json().catch(() => ({ success: true }));
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Approve proxy error:", error);
        return NextResponse.json({ error: "Failed to approve draft in automation engine", message: error.message }, { status: 500 });
    }
}
