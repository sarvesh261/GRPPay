import { dev } from '$app/environment';
import emailjs from '@emailjs/browser';

// EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_l1t25fk';
const EMAILJS_TEMPLATE_ID = 'template_i0y6dto';
const EMAILJS_USER_ID = 'user_-PTVprj99mhRuBo7X';
// If you have a private key, you can add it here
// const EMAILJS_PRIVATE_KEY = 'your_private_key_here';

/**
 * Sends an OTP email using EmailJS
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time password
 * @returns {Promise<boolean>} - Success status
 */
export async function sendOTPEmail(email, otp) {
    // Always log the OTP for development purposes
    console.log(`DEVELOPMENT OTP for ${email}: ${otp}`);
    
    try {
        // Initialize EmailJS
        emailjs.init(EMAILJS_USER_ID);
        
        // Prepare template parameters
        const templateParams = {
            to_email: email,
            otp: otp,
            app_name: 'GRPPay'
        };
        
        console.log('Sending email with params:', templateParams);
        
        // Use the send method directly
        const result = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );
        
        console.log('Email sent successfully:', result);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        
        // For development, still return true so testing can continue
        if (dev) {
            console.log('Development mode: Returning success despite error');
            return true;
        }
        
        return false;
    }
}