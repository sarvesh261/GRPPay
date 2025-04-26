import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

// @ts-ignore
export async function POST({ request }) {
    const { username, password } = await request.json();
    
    try {
        const result = await query(
            'SELECT user_id FROM users WHERE user_id = $1 AND password = $2',
            [username, password]
        );

        return json({
            success: result.rows.length > 0
        });
    } catch (error) {
        return json({ success: false }, { status: 500 });
    }
}