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
        const { user_id, amount_to_add } = await request.json();
        
        // Improved validation with better error handling
        if (!user_id) {
            return json({
                success: false,
                message: 'User ID is required.'
            }, { status: 400 });
        }
        
        // Convert amount to a number and validate
        const amountNumber = parseFloat(amount_to_add);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            return json({
                success: false,
                message: 'Please provide a valid positive amount.'
            }, { status: 400 });
        }
        
        // Get current balance
        const getBalanceQuery = 'SELECT balance FROM users WHERE user_id = $1';
        const balanceResult = await pool.query(getBalanceQuery, [user_id]);
        
        if (balanceResult.rows.length === 0) {
            return json({
                success: false,
                message: 'User not found.'
            }, { status: 404 });
        }
        
        // Ensure we're working with numbers for the calculation
        const currentBalance = parseFloat(balanceResult.rows[0].balance) || 0;
        // Explicitly use addition operator with parsed floats
        const newBalance = currentBalance + amountNumber;
        
        // Update balance in database
        const updateQuery = 'UPDATE users SET balance = $1 WHERE user_id = $2 RETURNING *';
        const result = await pool.query(updateQuery, [newBalance, user_id]);
        
        if (result.rows.length === 0) {
            return json({
                success: false,
                message: 'Failed to update balance.'
            }, { status: 500 });
        }
        
        console.log('Balance updated successfully:', {
            user_id,
            old_balance: currentBalance,
            amount_added: amountNumber,
            new_balance: newBalance
        });
        
        return json({
            success: true,
            message: 'Balance updated successfully.',
            new_balance: newBalance
        });
        
    } catch (error) {
        console.error('Error updating balance:', error);
        return json({
            success: false,
            // @ts-ignore
            message: 'An error occurred while updating the balance: ' + (error.message || 'Unknown error')
        }, { status: 500 });
    } finally {
        // Always close the pool when done
        await pool.end();
    }
}