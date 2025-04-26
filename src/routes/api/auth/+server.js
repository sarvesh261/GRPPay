import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

// @ts-ignore
export async function POST({ request }) {
    const { username, password } = await request.json();
    
    try {
        const result = await query(
            'SELECT user_id, balance FROM users WHERE user_id = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            return json({
                success: true,
                user: result.rows[0]
            });
        } else {
            return json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }
    } catch (error) {
        return json({
            success: false,
            message: 'Server error'
        }, { status: 500 });
    }
}