// @ts-nocheck
import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

export async function POST({ request }) {
    const { creator, members } = await request.json();

    try {
        // Start transaction
        await query('BEGIN');

        // Calculate total balance to transfer
        let totalTransfer = 0;
        for (const member of members) {
            const memberResult = await query(
                'SELECT balance FROM users WHERE user_id = $1',
                [member]
            );
            if (memberResult.rows.length === 0) {
                throw new Error(`User not found: ${member}`);
            }
            const memberBalance = memberResult.rows[0].balance;
            totalTransfer += memberBalance;

            // Subtract member balance
            await query(
                'UPDATE users SET balance = 0 WHERE user_id = $1',
                [member]
            );
        }

        // Add total transfer to creator's balance
        const creatorResult = await query(
            'SELECT balance FROM users WHERE user_id = $1',
            [creator]
        );
        if (creatorResult.rows.length === 0) {
            throw new Error(`Creator not found: ${creator}`);
        }
        const newBalance = creatorResult.rows[0].balance + totalTransfer;

        await query(
            'UPDATE users SET balance = $1 WHERE user_id = $2',
            [newBalance, creator]
        );

        // Create group
        const groupResult = await query(
            'INSERT INTO groups (by) VALUES ($1) RETURNING id',
            [creator]
        );
        const groupId = groupResult.rows[0].id;

        // Add members to group
        for (const member of members) {
            await query(
                'INSERT INTO members (id, member_user) VALUES ($1, $2)',
                [groupId, member]
            );
        }

        await query('COMMIT');

        return json({
            success: true,
            newBalance,
            group: { id: groupId, creator, members }
        });
    } catch (error) {
        await query('ROLLBACK');
        console.error('Error in update-balances:', error.message, error.stack);
        return json({
            success: false,
            message: 'Failed to update balances and create group'
        }, { status: 500 });
    }
}