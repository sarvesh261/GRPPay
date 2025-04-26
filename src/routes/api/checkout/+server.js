import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

// @ts-ignore
export async function POST({ request }) {
    const { groupId, purchaserId, items } = await request.json();
    
    try {
        // Start transaction
        await query('BEGIN');

        // Get user balance
        const userResult = await query(
            'SELECT balance FROM users WHERE user_id = $1',
            [purchaserId]
        );
        // @ts-ignore
        const currentBalance = userResult.rows[0].balance;

        // Calculate total
        // @ts-ignore
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Check balance
        if (currentBalance < total) {
            await query('ROLLBACK');
            return json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Update balance
        const newBalance = currentBalance - total;
        await query(
            'UPDATE users SET balance = $1 WHERE user_id = $2',
            [newBalance, purchaserId]
        );

        // Create transactions
        for (const item of items) {
            await query(
                `INSERT INTO transactions 
                (group_id, purchaser_id, item_id, quantity, total_amount)
                VALUES ($1, $2, $3, $4, $5)`,
                [groupId, purchaserId, item.id, item.quantity, item.price * item.quantity]
            );
        }

        await query('COMMIT');
        
        return json({
            success: true,
            newBalance
        });
    } catch (error) {
        await query('ROLLBACK');
        return json({
            success: false,
            message: 'Transaction failed'
        }, { status: 500 });
    }
}