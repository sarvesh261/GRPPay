import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

// @ts-ignore
export async function POST({ request }) {
    const { groupId, purchaserId, items } = await request.json();
    
    try {
        await query('BEGIN');

        // Get user balance and convert to number
        const userResult = await query(
            'SELECT balance FROM users WHERE user_id = $1',
            [purchaserId]
        );
        // @ts-ignore
        const currentBalance = parseFloat(userResult.rows[0].balance) || 0;

        // Validate input
        if (!groupId || !purchaserId || !Array.isArray(items) || items.length === 0) {
            await query('ROLLBACK');
            return json({
                success: false,
                message: 'Invalid input data'
            }, { status: 400 });
        }

        for (const item of items) {
            if (
                typeof item.id === 'undefined' ||
                isNaN(parseInt(item.id)) ||
                typeof item.price === 'undefined' ||
                isNaN(parseFloat(item.price)) ||
                typeof item.quantity === 'undefined' ||
                isNaN(parseInt(item.quantity))
            ) {
                await query('ROLLBACK');
                return json({
                    success: false,
                    message: 'Invalid item data'
                }, { status: 400 });
            }
        }

        // Calculate total with proper number handling
        // @ts-ignore
        const total = items.reduce((sum, item) => {
            const itemPrice = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity, 10) || 0; // Ensure quantity is an integer
            return sum + (itemPrice * quantity);
        }, 0);

        // Check balance with proper number comparison
        if (currentBalance < total) {
            await query('ROLLBACK');
            return json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Calculate and format new balance
        const newBalance = (currentBalance - total).toFixed(2);
        
        // Update balance with formatted value
        await query(
            'UPDATE users SET balance = $1 WHERE user_id = $2',
            [newBalance, purchaserId]
        );

        // Create transactions with proper number formatting
        for (const item of items) {
            const itemTotal = (parseFloat(item.price) * parseInt(item.quantity, 10)).toFixed(2);
            await query(
                `INSERT INTO transactions 
                (group_id, purchaser_id, item_id, quantity, total_amount)
                VALUES ($1, $2, $3, $4, $5)`,
                [groupId, purchaserId, item.id, parseInt(item.quantity, 10), itemTotal]
            );
        }

        await query('COMMIT');
        
        return json({
            success: true,
            newBalance: parseFloat(newBalance)
        });
    } catch (error) {
        await query('ROLLBACK');
        // @ts-ignore
        console.error('Checkout error:', error.message, error.stack); // Enhanced logging
        return json({
            success: false,
            message: 'Transaction failed'
        }, { status: 500 });
    }
}