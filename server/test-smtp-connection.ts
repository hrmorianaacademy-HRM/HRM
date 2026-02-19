#!/usr/bin/env node

/**
 * Standalone SMTP Connection Test Script
 * 
 * This script tests SMTP connections without running the full application.
 * Useful for debugging SMTP configuration issues.
 * 
 * Usage:
 *   npm run test:smtp
 * 
 * Or with custom parameters:
 *   node server/test-smtp-connection.ts --email="your@email.com" --password="yourpass" --server="smtp.gmail.com" --port=587
 */

import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';

const resolveDns = promisify(dns.resolve4);

interface SMTPConfig {
    email: string;
    password: string;
    server: string;
    port: number;
}

function parseArgs(): SMTPConfig {
    const args = process.argv.slice(2);
    const config: Partial<SMTPConfig> = {};

    args.forEach(arg => {
        const [key, value] = arg.split('=');
        const cleanKey = key.replace('--', '');

        if (cleanKey === 'email') config.email = value.replace(/"/g, '');
        if (cleanKey === 'password') config.password = value.replace(/"/g, '');
        if (cleanKey === 'server') config.server = value.replace(/"/g, '');
        if (cleanKey === 'port') config.port = parseInt(value.replace(/"/g, ''));
    });

    // Use environment variables as fallback
    return {
        email: config.email || process.env.SMTP_EMAIL || '',
        password: config.password || process.env.SMTP_PASSWORD || '',
        server: config.server || process.env.SMTP_SERVER || 'smtp.gmail.com',
        port: config.port || parseInt(process.env.SMTP_PORT || '587')
    };
}

async function testSMTPConnection(config: SMTPConfig): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  SMTP Connection Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Validate inputs
    if (!config.email || !config.password) {
        console.error('❌ Error: Email and password are required');
        console.log('\nUsage:');
        console.log('  npm run test:smtp -- --email="your@email.com" --password="yourpass" --server="smtp.gmail.com" --port=587');
        console.log('\nOr set environment variables:');
        console.log('  SMTP_EMAIL, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT');
        process.exit(1);
    }

    console.log('Configuration:');
    console.log(`  Email:  ${config.email}`);
    console.log(`  Server: ${config.server}`);
    console.log(`  Port:   ${config.port}`);
    console.log(`  Pass:   ${'*'.repeat(config.password.length)}\n`);

    // Step 1: DNS Resolution
    console.log('Step 1: DNS Resolution');
    try {
        const addresses = await resolveDns(config.server);
        console.log(`  ✓ ${config.server} → ${addresses.join(', ')}\n`);
    } catch (err: any) {
        console.error(`  ✗ DNS lookup failed: ${err.message}`);
        console.error('  → Check that the SMTP server hostname is correct\n');
        process.exit(1);
    }

    // Step 2: Create Transporter
    console.log('Step 2: Create SMTP Transporter');
    const isSSL = config.port === 465;
    const isTLS = config.port === 587 || config.port === 25 || config.port === 2525;

    const transporter = nodemailer.createTransport({
        host: config.server,
        port: config.port,
        secure: isSSL,
        auth: {
            user: config.email,
            pass: config.password,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        requireTLS: isTLS,
        tls: {
            rejectUnauthorized: false, // Allow self-signed certs for testing
            minVersion: 'TLSv1.2'
        },
        debug: true,
        logger: true
    });

    console.log(`  ✓ Transporter created (${isSSL ? 'SSL' : isTLS ? 'TLS' : 'Plain'})\n`);

    // Step 3: Verify Connection
    console.log('Step 3: Verify SMTP Connection');
    try {
        await transporter.verify();
        console.log('  ✓ SMTP connection verified successfully\n');
    } catch (err: any) {
        console.error(`  ✗ Verification failed: ${err.message}`);
        console.error(`  ✗ Error code: ${err.code}\n`);

        console.log('Troubleshooting:');
        if (err.code === 'EAUTH') {
            console.log('  • Authentication failed - check your email and password');
            console.log('  • For Gmail, use an App Password (not your regular password)');
            console.log('  • Generate at: https://myaccount.google.com/apppasswords');
        } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION') {
            console.log('  • Connection timed out - check server and port');
            console.log('  • Port 587 = TLS, Port 465 = SSL');
            console.log('  • Check firewall settings');
        } else if (err.code === 'ESOCKET') {
            console.log('  • Network error - check internet connection');
        }
        console.log('');
        process.exit(1);
    }

    // Step 4: Send Test Email
    console.log('Step 4: Send Test Email');
    const testRecipient = config.email; // Send to self for testing

    try {
        const info = await transporter.sendMail({
            from: `"SMTP Test" <${config.email}>`,
            to: testRecipient,
            subject: 'SMTP Test Email - ' + new Date().toLocaleString(),
            text: 'This is a test email. If you received this, your SMTP configuration is working correctly!',
            html: '<h2>✓ Success!</h2><p>This is a test email. If you received this, your SMTP configuration is working correctly!</p>'
        });

        console.log(`  ✓ Email sent successfully`);
        console.log(`  ✓ Message ID: ${info.messageId}`);
        console.log(`  ✓ Recipient: ${testRecipient}\n`);
    } catch (err: any) {
        console.error(`  ✗ Failed to send email: ${err.message}\n`);
        process.exit(1);
    }

    // Success
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✓ All tests passed!');
    console.log('  ✓ SMTP configuration is working correctly');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the test
const config = parseArgs();
testSMTPConnection(config).catch(err => {
    console.error('\n❌ Unexpected error:', err);
    process.exit(1);
});
