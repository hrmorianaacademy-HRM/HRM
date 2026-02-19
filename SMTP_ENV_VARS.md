# Email Configuration Guide (Render & Local)

## 🚨 IMPORTANT FOR RENDER DEPLOYMENTS
**Render's free tier BLOCKS all outbound SMTP ports (25, 465, 587).**
If you try to use Gmail SMTP directly on Render, it will fail with `ETIMEDOUT`.

**Solution:** Use the **Resend API** (HTTP-based) instead. It's free and works on Render.

---

## configuration Option 1: Resend API (Recommended for Render)

1. **Sign Up**: Go to [resend.com](https://resend.com) and create a free account.
2. **Get API Key**: Create a new API Key in the dashboard.
3. **Configure Render**:
   - Go to your Render Dashboard → Environment
   - Add a new Environment Variable:
     - Key: `RESEND_API_KEY`
     - Value: `re_your_api_key_here`
4. **Redeploy**: Manual redeploy might be needed for env variable to take effect.

If `RESEND_API_KEY` is present, the app will automatically use it instead of SMTP.

---

## Configuration Option 2: SMTP (Local Development Only)

You can still use SMTP for local testing or on platforms that don't block ports.

### Setup (Local .env file)
Create a `.env` file in your project root:
```bash
# Gmail Configuration
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

### Gmail Requirements
1. Enable 2-Factor Authentication.
2. Generate an **App Password** (https://myaccount.google.com/apppasswords).
3. Use that 16-char password, NOT your login password.

## Priority Logic
The application selects the email method in this order:

1. **Resend API**: If `RESEND_API_KEY` is set (Highest Priority).
2. **Database SMTP**: If configured via UI (`/email-settings`).
3. **Env Var SMTP**: Fallback variables (`SMTP_EMAIL` etc.).
