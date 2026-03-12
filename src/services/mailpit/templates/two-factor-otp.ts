export function getTwoFactorOtpHtml(otp: string, name?: string | null) {
  const displayName = name || "User";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #0f172a; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; text-align: center; }
    .code-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 30px 0; display: inline-block; width: 80%; }
    .code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a; }
    .text { color: #475569; font-size: 16px; line-height: 1.6; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .warning { color: #ef4444; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ark LMS</h1>
    </div>
    <div class="content">
      <p class="text">Hello ${displayName},</p>
      <p class="text">You requested a verification code to secure your account. Please use the code below:</p>
      
      <div class="code-box">
        <span class="code">${otp}</span>
      </div>
      
      <p class="text">This code will expire in <strong>5 minutes</strong>.</p>
      
      <p class="warning">If you did not request this code, please ignore this email or contact support if you suspect suspicious activity.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Ark Learning Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
