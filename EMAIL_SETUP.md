# Email Notifications Setup Guide

## Overview
QEP AISolve uses [Resend](https://resend.com) to send email notifications when strategic documents are ready. This dramatically improves user retention by bringing users back after the 2-3 minute document generation.

## Setup Instructions

### 1. Create Resend Account
1. Go to [resend.com/signup](https://resend.com/signup)
2. Sign up with your email
3. Verify your email address

### 2. Add Domain (Production)
For production emails, you need to verify your domain:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `qep-aisolve.app`)
4. Add the DNS records Resend provides to your domain registrar:
   - **TXT record** for domain verification
   - **DKIM records** for email authentication
5. Wait for verification (usually 1-5 minutes)

### 3. Get API Key
1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it `QEP AISolve Production`
4. Select **Full Access** permissions
5. Copy the API key (starts with `re_`)

### 4. Set Environment Variables

**Local Development** (.env.local):
```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production** (Vercel):
```bash
# Go to Vercel Dashboard → Your Project → Settings → Environment Variables
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=https://qep-aisolve.app
```

### 5. Update Email From Address

In `/lib/email/client.ts`, update the `EMAIL_FROM` constant:

```typescript
// Development (before domain verification)
export const EMAIL_FROM = 'QEP AISolve <onboarding@resend.dev>';

// Production (after domain verification)
export const EMAIL_FROM = 'QEP AISolve <noreply@qep-aisolve.app>';
```

## Testing

### Local Testing
1. Set `RESEND_API_KEY` in `.env.local`
2. Use the Resend test domain: `onboarding@resend.dev`
3. Generate a document
4. Check email at your test address

### Production Testing
1. Add `RESEND_API_KEY` to Vercel
2. Deploy to production
3. Generate a test document
4. Verify email arrives correctly

## Email Template

The email includes:
- **Subject**: "Your Strategic Document is Ready: [Problem Title]"
- **Preview Text**: First 300 characters of executive summary
- **CTA Button**: Direct link to view document
- **Content**:
  - Personalized greeting
  - Problem title
  - Executive summary preview
  - List of what's included
  - Prominent "View Document" button
  - Footer with links

## Monitoring

### Resend Dashboard
- **Emails**: View all sent emails
- **Logs**: See delivery status
- **Analytics**: Open rates, click rates
- **Bounces**: Failed deliveries

### Application Logs
Check Vercel logs for:
```
Email sent successfully to: user@example.com
```

Or errors:
```
Failed to send email notification: [error details]
```

## Troubleshooting

### Email Not Sending
1. Check `RESEND_API_KEY` is set correctly
2. Verify API key has correct permissions
3. Check Vercel logs for errors
4. Ensure `EMAIL_FROM` domain is verified (production)

### Email Going to Spam
1. Verify DKIM records are set up
2. Add SPF record if not present
3. Use your verified domain (not resend.dev in production)
4. Check Resend's spam score in dashboard

### Wrong URL in Email
1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Should be `https://qep-aisolve.app` in production
3. Should be `http://localhost:3000` in development

## Cost
Resend pricing (as of 2025):
- **Free tier**: 3,000 emails/month
- **Pro tier**: $20/month for 50,000 emails
- **Enterprise**: Custom pricing

**Expected usage**:
- ~1 email per document generated
- At 100 documents/day = 3,000/month (fits free tier)
- At 500 documents/day = 15,000/month (needs Pro tier)

## Best Practices

1. **Monitor deliverability**: Check bounce rates weekly
2. **Test regularly**: Generate test documents to verify emails work
3. **Keep unsubscribe option**: Add unsubscribe link if sending marketing emails
4. **Use analytics**: Track open/click rates to optimize email content
5. **Handle failures gracefully**: Email sending never blocks document generation

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Next.js Guide](https://resend.com/docs/send-with-nextjs)
- [Email Best Practices](https://resend.com/docs/knowledge-base/email-best-practices)
