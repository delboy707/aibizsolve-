import { Resend } from 'resend';

let resendClient: Resend | null = null;

export const resend = (): Resend => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

// Email templates
export const EMAIL_FROM = 'QEP AISolve <noreply@qep-aisolve.app>';

export interface DocumentReadyEmailData {
  userName: string;
  problemTitle: string;
  documentUrl: string;
  executiveSummary: string;
}

export async function sendDocumentReadyEmail(
  to: string,
  data: DocumentReadyEmailData
): Promise<void> {
  const { userName, problemTitle, documentUrl, executiveSummary } = data;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Strategic Document is Ready</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <div style="width: 48px; height: 48px; background: white; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="color: #1e40af; font-weight: bold; font-size: 24px;">Q</span>
    </div>
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Your Strategic Document is Ready</h1>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      Your strategic analysis for <strong>"${problemTitle}"</strong> has been completed with our top-tier AI analysis.
    </p>

    <!-- Executive Summary Preview -->
    <div style="background: #f9fafb; border-left: 4px solid #1e40af; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Executive Summary Preview</h3>
      <p style="font-size: 15px; margin: 0; color: #374151; line-height: 1.7;">${executiveSummary}</p>
    </div>

    <p style="font-size: 16px; margin-bottom: 30px;">
      Your document includes:
    </p>

    <ul style="font-size: 15px; color: #4b5563; margin-bottom: 30px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Complete SCQA strategic analysis</li>
      <li style="margin-bottom: 8px;">30-60-90 day implementation roadmap</li>
      <li style="margin-bottom: 8px;">Risk mitigation strategies</li>
      <li style="margin-bottom: 8px;">Counterintuitive options (Alchemy Layer)</li>
    </ul>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 40px 0;">
      <a href="${documentUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.2);">
        View Your Strategic Document
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      This document was generated with Claude Opus 4.5, providing institutional-grade strategic analysis in minutes instead of weeks.
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 30px 20px; color: #6b7280; font-size: 13px;">
    <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} QEP AISolve. All rights reserved.</p>
    <p style="margin: 0;">
      <a href="${documentUrl}" style="color: #1e40af; text-decoration: none;">View Document</a> •
      <a href="https://qep-aisolve.app/dashboard" style="color: #1e40af; text-decoration: none;">Dashboard</a>
    </p>
  </div>

</body>
</html>
  `;

  const textContent = `
Your Strategic Document is Ready

Hi ${userName},

Your strategic analysis for "${problemTitle}" has been completed.

EXECUTIVE SUMMARY PREVIEW:
${executiveSummary}

Your document includes:
- Complete SCQA strategic analysis
- 30-60-90 day implementation roadmap
- Risk mitigation strategies
- Counterintuitive options (Alchemy Layer)

View your document: ${documentUrl}

---
© ${new Date().getFullYear()} QEP AISolve
  `;

  try {
    await resend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your Strategic Document is Ready: ${problemTitle}`,
      html: htmlContent,
      text: textContent,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
