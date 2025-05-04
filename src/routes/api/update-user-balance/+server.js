import { json } from '@sveltejs/kit';
import pg from 'pg';
// @ts-ignore
// Change this line:
// To this:
import { sendOTPEmail } from '$lib/emailService';

// In-memory OTP storage (in a production app, use Redis or another solution)
const otpStore = new Map();

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
        const requestData = await request.json();
        const { action } = requestData;

        // Handle different actions based on the request
        if (action === 'generate_otp') {
            return await generateOTP(requestData, pool);
        } else if (action === 'verify_otp') {
            return await verifyOTPAndUpdateBalance(requestData, pool);
        } else {
            // Handle the original direct update method for backward compatibility
            const { user_id, amount_to_add } = requestData;
            
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
        }
    } catch (error) {
        console.error('Error in update-user-balance:', error);
        return json({
            success: false,
            // @ts-ignore
            message: 'An error occurred: ' + (error.message || 'Unknown error')
        }, { status: 500 });
    } finally {
        // Always close the pool when done
        await pool.end();
    }
}

/**
 * Generate OTP for the given phone number
 * @param {Object} data Request data
 * @param {pg.Pool} pool Database connection pool
 */
async function generateOTP(data, pool) {
    // @ts-ignore
    const { phone_number, email, user_id } = data;
    
    if (!phone_number) {
        return json({
            success: false,
            message: 'Phone number is required'
        }, { status: 400 });
    }

    if (!email) {
        return json({
            success: false,
            message: 'Email address is required'
        }, { status: 400 });
    }

    if (!user_id) {
        return json({
            success: false,
            message: 'User ID is required'
        }, { status: 400 });
    }

    try {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with expiration (5 minutes)
        otpStore.set(phone_number, {
            otp,
            userId: user_id,
            expires: Date.now() + 5 * 60 * 1000 // 5 minutes
        });
        
        console.log(`Attempting to send OTP email to ${email} with OTP: ${otp}`);
        
        // Send OTP via email
        const emailSent = await sendOTPEmail(email, otp);
        
        console.log(`Email sending result: ${emailSent ? 'Success' : 'Failed'}`);
        
        // Always include OTP in development mode for testing
        return json({
            success: true,
            message: emailSent ? 'OTP sent to your email' : 'OTP generated but email sending failed',
            user_id: user_id,
            // Always include OTP for now to help with testing
            otp: otp
        });
    } catch (error) {
        console.error('Error generating OTP:', error);
        return json({
            success: false,
            // @ts-ignore
            message: 'Failed to generate OTP: ' + (error.message || 'Unknown error'),
            // @ts-ignore
            error_details: error.toString()
        }, { status: 500 });
    }
}

/**
 * Verify OTP and update user balance
 * @param {Object} data Request data
 * @param {pg.Pool} pool Database connection pool
 */
async function verifyOTPAndUpdateBalance(data, pool) {
    // @ts-ignore
    const { phone_number, otp, amount_to_add, user_id } = data;
    
    if (!phone_number || !otp || !amount_to_add || !user_id) {
        return json({
            success: false,
            message: 'Missing required fields'
        }, { status: 400 });
    }
    
    // Convert amount to a number and validate
    const amountNumber = parseFloat(amount_to_add);
    if (isNaN(amountNumber) || amountNumber <= 0) {
        return json({
            success: false,
            message: 'Please provide a valid positive amount'
        }, { status: 400 });
    }
    
    // Check if OTP exists and is valid
    const otpData = otpStore.get(phone_number);
    if (!otpData) {
        return json({
            success: false,
            message: 'No OTP was generated for this phone number'
        }, { status: 400 });
    }
    
    // Verify OTP
    if (otpData.otp !== otp) {
        return json({
            success: false,
            message: 'Invalid OTP'
        }, { status: 400 });
    }
    
    // Check if OTP has expired
    if (Date.now() > otpData.expires) {
        otpStore.delete(phone_number);
        return json({
            success: false,
            message: 'OTP has expired'
        }, { status: 400 });
    }
    
    // Verify user_id matches the one associated with the phone number
    if (otpData.userId !== user_id) {
        return json({
            success: false,
            message: 'User ID mismatch'
        }, { status: 400 });
    }
    
    try {
        // Get current balance
        const getBalanceQuery = 'SELECT balance FROM users WHERE user_id = $1';
        const balanceResult = await pool.query(getBalanceQuery, [user_id]);
        
        if (balanceResult.rows.length === 0) {
            return json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }
        
        // Update balance
        const currentBalance = parseFloat(balanceResult.rows[0].balance) || 0;
        const newBalance = currentBalance + amountNumber;
        
        const updateQuery = 'UPDATE users SET balance = $1 WHERE user_id = $2 RETURNING *';
        const result = await pool.query(updateQuery, [newBalance, user_id]);
        
        if (result.rows.length === 0) {
            return json({
                success: false,
                message: 'Failed to update balance'
            }, { status: 500 });
        }
        
        // Remove the OTP from storage
        otpStore.delete(phone_number);
        
        console.log('Balance updated successfully:', {
            user_id,
            old_balance: currentBalance,
            amount_added: amountNumber,
            new_balance: newBalance
        });
        
        return json({
            success: true,
            message: 'Balance updated successfully',
            new_balance: newBalance
        });
    } catch (error) {
        console.error('Error updating balance:', error);
        return json({
            success: false,
            message: 'An error occurred while updating the balance'
        }, { status: 500 });
    // @ts-ignore
    }
}