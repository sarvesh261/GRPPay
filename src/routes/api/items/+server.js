import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

export async function GET() {
    try {
        const result = await query('SELECT * FROM items');
        return json({ items: result.rows });
    } catch (error) {
        console.error('Database error:', error);
        return json({ items: [] }, { status: 500 });
    }
}