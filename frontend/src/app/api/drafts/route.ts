import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const dbUrl = process.env.db_url || process.env.DATABASE_URL;
const isLocal = !dbUrl?.includes('aiven') && (dbUrl?.includes('localhost') || dbUrl?.includes('127.0.0.1'));

// Strip sslmode=require from the URL so it doesn't override our custom SSL config
const cleanDbUrl = dbUrl ? dbUrl.replace(/\?sslmode=[a-zA-Z-]+/, '') : undefined;

const pool = new Pool({
    connectionString: cleanDbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const sessionId = searchParams.get('session_id');
        const search = searchParams.get('search');
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let query = 'SELECT * FROM content_drafts WHERE 1=1';
        const values: any[] = [];
        let paramIndex = 1;

        if (sessionId) {
            query += ` AND session_id = $${paramIndex}`;
            values.push(sessionId);
            paramIndex++;
        }

        if (search) {
            query += ` AND title ILIKE $${paramIndex}`;
            values.push(`%${search}%`);
            paramIndex++;
        }

        if (type) {
            query += ` AND input_type = $${paramIndex}`;
            values.push(type);
            paramIndex++;
        }

        if (status) {
            query += ` AND status = $${paramIndex}`;
            values.push(status);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND created_at >= $${paramIndex}`;
            values.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND created_at <= $${paramIndex}`;
            // Adjust to end of day if endDate is just a date string like YYYY-MM-DD
            if (endDate.length === 10) {
                values[values.length - 1] = `${endDate} 23:59:59`;
            }
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, values);

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error("Database query failed:", error);
        return NextResponse.json({ error: "Failed to fetch drafts", details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, body: draftBody } = body;

        if (!id || !draftBody) {
            return NextResponse.json({ error: "Missing draft id or body" }, { status: 400 });
        }

        const updateQuery = `
            UPDATE content_drafts 
            SET body = $1 
            WHERE id = $2 
            RETURNING *
        `;
        const result = await pool.query(updateQuery, [draftBody, id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Draft not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, draft: result.rows[0] });
    } catch (error: any) {
        console.error("Save edit failed:", error);
        return NextResponse.json({ error: "Failed to save draft edit", details: error.message }, { status: 500 });
    }
}
