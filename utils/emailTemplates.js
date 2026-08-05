/**
 * Password reset email template.
 * @param {{ firstName: string, resetUrl: string }} params
 */
export const passwordResetTemplate = ({ firstName, resetUrl }) => ({
  subject: "Reset your TronSchool password",
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a56db;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">TronSchool</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#111827;font-size:16px;">Hi ${firstName},</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                We received a request to reset the password for your TronSchool account.
                Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="border-radius:6px;background:#1a56db;">
                    <a href="${resetUrl}" target="_blank"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 32px;word-break:break-all;">
                <a href="${resetUrl}" style="color:#1a56db;font-size:13px;">${resetUrl}</a>
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email —
                your password won't change unless you click the link above.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                &copy; ${new Date().getFullYear()} TronSchool. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim(),
});
