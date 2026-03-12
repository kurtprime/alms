export function getVerificationEmailHtml(url: string, name?: string | null) {
  const displayName = name || "User";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #0f172a; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; text-align: center; }
    .button { display: inline-block; background-color: #e02424; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .text { color: #475569; font-size: 16px; line-height: 1.6; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ark LMS</h1>
    </div>
    <div class="content">
      <p class="text">Hello ${displayName},</p>
      <p class="text">Thank you for registering. Please verify your email address to activate your account.</p>
      
      <a href="${url}" class="button">Verify Email Address</a>
      
      <p class="text" style="font-size: 14px; color: #64748b;">
        If the button above does not work, copy and paste the following link into your browser:<br>
        <a href="${url}" style="word-break: break-all; color: #2563eb;">${url}</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Ark Learning Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
