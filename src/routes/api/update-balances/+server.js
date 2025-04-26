// @ts-nocheck
import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

export async function POST({ request }) {
    const { creator, members } = await request.json();

    try {
        await query('BEGIN');

        let totalTransfer = 0;
        for (const member of members) {
            const memberResult = await query(
                'SELECT balance FROM users WHERE user_id = $1',
                [member]
            );
            if (memberResult.rows.length === 0) {
                throw new Error(`User not found: ${member}`);
            }
            // Convert string to number and handle decimals properly
            const memberBalance = parseFloat(memberResult.rows[0].balance) || 0;
            totalTransfer += memberBalance;

            await query(
                'UPDATE users SET balance = 0 WHERE user_id = $1',
                [member]
            );
        }

        const creatorResult = await query(
            'SELECT balance FROM users WHERE user_id = $1',
            [creator]
        );
        if (creatorResult.rows.length === 0) {
            throw new Error(`Creator not found: ${creator}`);
        }
        
        // Convert creator's balance to number and calculate new balance
        const creatorBalance = parseFloat(creatorResult.rows[0].balance) || 0;
        const newBalance = creatorBalance + totalTransfer;

        // Ensure the balance is properly formatted before updating
        await query(
            'UPDATE users SET balance = $1 WHERE user_id = $2',
            [newBalance.toFixed(2), creator]
        );

        const groupResult = await query(
            'INSERT INTO groups (by) VALUES ($1) RETURNING id',
            [creator]
        );
        const groupId = groupResult.rows[0].id;

        for (const member of members) {
            await query(
                'INSERT INTO members (id, member_user) VALUES ($1, $2)',
                [groupId, member]
            );
        }

        await query('COMMIT');

        return json({
            success: true,
            newBalance: parseFloat(newBalance.toFixed(2)),
            group: { id: groupId, creator, members }
        });
    } catch (error) {
        await query('ROLLBACK');
        console.error('Error in update-balances:', error);
        return json({
            success: false,
            message: 'Failed to update balances and create group'
        }, { status: 500 });
    }
}