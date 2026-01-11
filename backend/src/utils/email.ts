import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '../config/env';

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  console.log('📧 Attempting to send email to:', to);
  console.log('🔑 Resend API key status:', RESEND_API_KEY ? `Configured (${RESEND_API_KEY.substring(0, 10)}...)` : 'Not configured');
  
  // Use Resend if API key is provided (recommended for production)
  if (RESEND_API_KEY && RESEND_API_KEY.trim() !== '' && RESEND_API_KEY.startsWith('re_')) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      
      // Resend requires verified domain or uses their test domain
      // For testing: use onboarding@resend.dev (works automatically)
      // For production: verify your domain in Resend and use like noreply@yourdomain.com
      let fromEmail = 'onboarding@resend.dev'; // Default Resend test domain
      
      // If RESEND_FROM_EMAIL is a Resend domain or verified domain, use it
      if (RESEND_FROM_EMAIL && RESEND_FROM_EMAIL.includes('@') && !RESEND_FROM_EMAIL.includes('@gmail.com')) {
        fromEmail = RESEND_FROM_EMAIL;
      }
      
      console.log(`📤 Sending email via Resend from ${fromEmail} to ${to}...`);
      console.log(`📧 Email subject: ${subject}`);
      console.log(`🔑 Using API key: ${RESEND_API_KEY.substring(0, 10)}...`);
      
      const result = await resend.emails.send({
        from: `MangoTree <${fromEmail}>`,
        to: [to],
        subject,
        html,
      });
      
      console.log('📬 Resend API response received');
      console.log('Response structure:', JSON.stringify(result, null, 2));
      
      // Check if the result has an error property (Resend returns errors in response, not as thrown exceptions)
      if (result.error) {
        console.error('❌ Resend API returned an error in response:', result.error);
        throw new Error(`Resend API error: ${JSON.stringify(result.error)}`);
      }
      
      // Check if the result indicates success (has data.id)
      if (result.data && result.data.id) {
        console.log(`✅ Email sent successfully via Resend! Email ID: ${result.data.id}`);
        console.log(`📧 Sent from: ${fromEmail}`);
        console.log(`📧 Sent to: ${to}`);
        console.log(`🔗 Check dashboard: https://resend.com/emails`);
        return;
      } else {
        console.error('❌ Resend returned unexpected response structure:', result);
        console.error('Expected structure: { data: { id: string } } or { error: {...} }');
        throw new Error('Resend API returned unexpected response. Email may not have been sent. Check the response structure above.');
      }
    } catch (error: any) {
      console.error('❌ Resend email failed!');
      console.error('Error message:', error.message || error);
      console.error('Error type:', error.constructor.name);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      if (error.response) {
        console.error('Resend API response:', error.response);
      }
      if (error.body) {
        console.error('Resend error body:', error.body);
      }
      if (error.data) {
        console.error('Resend error data:', error.data);
      }
      
      // Don't fall back to SMTP if Resend fails - throw the error so it can be handled properly
      throw new Error(`Resend failed: ${error.message || 'Unknown error'}. Please check your RESEND_API_KEY in .env file and verify it in the Resend dashboard.`);
    }
  } else {
    // No Resend API key configured - throw error instead of trying SMTP without credentials
    throw new Error('Email sending failed: RESEND_API_KEY not configured. Please add RESEND_API_KEY=re_your_key_here to your .env file and restart the server.');
  }

  // Fallback to SMTP (Gmail or custom SMTP)
  const transporter = nodemailer.createTransport(
    process.env.SMTP_HOST
      ? {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
      : {
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
  );

  const fromEmail = process.env.SMTP_USER || RESEND_FROM_EMAIL;

  await transporter.sendMail({
    from: `"MangoTree" <${fromEmail}>`,
    to,
    subject,
    html,
  });
  
  console.log(`✅ Email sent successfully via SMTP to ${to} from ${fromEmail}`);
};