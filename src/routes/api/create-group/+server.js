import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

// @ts-ignore
export async function POST({ request }) {
    const { creator, members } = await request.json();
    
    try {
        // Create group
        const groupResult = await query(
            'INSERT INTO groups (by) VALUES ($1) RETURNING id',
            [creator]
        );
        
        // @ts-ignore
        const groupId = groupResult.rows[0].id;
        
        // Add members
        for (const member of members) {
            await query(
                'INSERT INTO members (id, member_user) VALUES ($1, $2)',
                [groupId, member]
            );
        }

        return json({
            success: true,
            group: { id: groupId, creator, members }
        });
    } catch (error) {
        return json({ 
            success: false,
            message: 'Failed to create group'
        }, { status: 500 });
    }
}