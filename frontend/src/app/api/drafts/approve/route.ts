import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const dbUrl = process.env.db_url || process.env.DATABASE_URL;
const isLocal = !dbUrl?.includes('aiven') && (dbUrl?.includes('localhost') || dbUrl?.includes('127.0.0.1'));
const cleanDbUrl = dbUrl ? dbUrl.replace(/\?sslmode=[a-zA-Z-]+/, '') : undefined;

const pool = new Pool({
    connectionString: cleanDbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { draft_id, draft_body } = body;

        if (!draft_id || !draft_body) {
            return NextResponse.json({ error: "Missing draft_id or draft_body" }, { status: 400 });
        }

        const updateQuery = `
            UPDATE content_drafts 
            SET status = 'approved', body = $1 
            WHERE id = $2 
            RETURNING *
        `;
        const result = await pool.query(updateQuery, [draft_body, draft_id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Draft not found" }, { status: 404 });
        }

        const webhookUrl = process.env.N8N_PART_B_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ draft_id: draft_id, publishNow: false })
                });
            } catch (webhookError) {
                console.error("Failed to trigger n8n webhook:", webhookError);
            }
        }

        return NextResponse.json({ success: true, draft: result.rows[0] });
    } catch (error: any) {
        console.error("Approval flow failed:", error);
        return NextResponse.json({ error: "Failed to approve draft", details: error.message }, { status: 500 });
    }
}
