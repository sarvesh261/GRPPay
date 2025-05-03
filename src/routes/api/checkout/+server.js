import { json } from '@sveltejs/kit';
import pg from 'pg';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    // Create a direct connection for this request
    const pool = new pg.Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'grppay',
        password: 'Sarveshpsgit261',
        port: 5432,
    });

    try {
        const { userId, items, totalAmount, groupId } = await request.json();
        
        // Validate input
        if (!userId) {
            return json({
                success: false,
                message: 'User ID is required.'
            }, { status: 400 });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return json({
                success: false,
                message: 'No items provided for checkout.'
            }, { status: 400 });
        }

        // Convert total amount to a number and validate
        const checkoutAmount = parseFloat(totalAmount);
        if (isNaN(checkoutAmount) || checkoutAmount <= 0) {
            return json({
                success: false,
                message: 'Invalid checkout amount.'
            }, { status: 400 });
        }
        
        // Begin transaction
        await pool.query('BEGIN');
        
        // 1. Get current balance
        const getBalanceQuery = 'SELECT balance FROM users WHERE user_id = $1';
        const balanceResult = await pool.query(getBalanceQuery, [userId]);
        
        if (balanceResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return json({
                success: false,
                message: 'User not found.'
            }, { status: 404 });
        }
        
        const currentBalance = parseFloat(balanceResult.rows[0].balance) || 0;
        
        // 2. Check if user has enough balance
        if (currentBalance < checkoutAmount) {
            await pool.query('ROLLBACK');
            return json({
                success: false,
                message: 'Insufficient balance.'
            }, { status: 400 });
        }
        
        // 3. Update user balance
        const newBalance = currentBalance - checkoutAmount;
        const updateQuery = 'UPDATE users SET balance = $1 WHERE user_id = $2 RETURNING *';
        const result = await pool.query(updateQuery, [newBalance, userId]);
        
        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return json({
                success: false,
                message: 'Failed to update balance.'
            }, { status: 500 });
        }
        
        // 4. Record each item in the transactions table
        for (const item of items) {
            const quantity = item.quantity || 1;
            const price = parseFloat(item.price);
            const itemTotal = quantity * price;
            
            await pool.query(
                'INSERT INTO transactions (group_id, purchaser_id, item_id, quantity, total_amount) VALUES ($1, $2, $3, $4, $5)',
                [groupId, userId, item.id, quantity, itemTotal]
            );
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
        console.log('Checkout successful:', {
            userId,
            oldBalance: currentBalance,
            amountSpent: checkoutAmount,
            newBalance
        });
        
        return json({
            success: true,
            message: 'Checkout successful.',
            newBalance
        });
        
    } catch (error) {
        // Rollback transaction on error
        await pool.query('ROLLBACK');
        console.error('Error during checkout:', error);
        return json({
            success: false,
            // @ts-ignore
            message: 'An error occurred during checkout: ' + (error.message || 'Unknown error')
        }, { status: 500 });
    } finally {
        // Always close the pool when done
        await pool.end();
    }
}