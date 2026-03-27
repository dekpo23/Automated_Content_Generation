import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const dbUrl = process.env.db_url || process.env.DATABASE_URL;
const isLocal = !dbUrl?.includes('aiven') && (dbUrl?.includes('localhost') || dbUrl?.includes('127.0.0.1'));
const cleanDbUrl = dbUrl ? dbUrl.replace(/\?sslmode=[a-zA-Z-]+/, '') : undefined;

const pool = new Pool({
    connectionString: cleanDbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Missing draft ID" }, { status: 400 });
        }

        const query = 'SELECT status FROM content_drafts WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Draft not found" }, { status: 404 });
        }

        return NextResponse.json({ status: result.rows[0].status });
    } catch (error: any) {
        console.error("Database query failed:", error);
        return NextResponse.json({ error: "Failed to fetch draft status", details: error.message }, { status: 500 });
    }
}
