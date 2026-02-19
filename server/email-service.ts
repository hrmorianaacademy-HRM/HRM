import nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

export interface SMTPConfig {
    smtpServer: string;
    smtpPort: number;
    smtpEmail: string;
    appPassword: string;
}

/**
 * Sends an email using Resend API (priority) or SMTP (fallback).
 * Resend is preferred because Render blocks outbound SMTP connections.
 * SMTP is kept as fallback for local development or other hosting platforms.
 */
export async function sendEmail(options: EmailOptions, config?: SMTPConfig) {
    const resendKey = process.env.RESEND_API_KEY;

    // PRIORITY: Use Resend API (works on Render and cloud platforms)
    if (resendKey) {
        console.log(`[EmailService] Using Resend API to send email to ${options.to}`);
        return sendWithResend(options, resendKey);
    }

    // FALLBACK: Use SMTP (for local dev or platforms that allow SMTP)
    if (config && config.smtpEmail && config.appPassword) {
        console.log(`[EmailService] Using SMTP to send email to ${options.to} (From: ${config.smtpEmail})`);
        return sendWithSMTP(options, config);
    }

    throw new Error("Email configuration is required. Please set RESEND_API_KEY or configure SMTP settings.");
}

async function sendWithResend(options: EmailOptions, apiKey: string) {
    // Resend requires domain verification for custom "from" addresses
    // Always use Resend's default sender unless a verified domain is configured
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    console.log(`[EmailService] Resend: from=${fromEmail}, to=${options.to}`);

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            from: fromEmail,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
}

async function sendWithSMTP(options: EmailOptions, config: SMTPConfig) {
    const transporter = nodemailer.createTransport({
        host: config.smtpServer,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
            user: config.smtpEmail,
            pass: config.appPassword,
        },
        tls: {
            // Don't fail on invalid certs
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
    });

    const mailOptions = {
        from: options.from || `"${process.env.APP_NAME || 'HRM Portal'}" <${config.smtpEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    return await transporter.sendMail(mailOptions);
}
