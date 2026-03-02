export function getPasswordResetHtml(
  resetLink: string,
  userName: string | undefined | null,
) {
  const displayName = userName || "Student";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* RESET STYLES */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; }
    
    /* CLIENT-SPECIFIC STYLES */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }

    /* BUTTON HOVER */
    .button:hover { background-color: #1d4ed8 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <!-- PREVIEW TEXT (Hidden) -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Reset your password for Ark LMS.
  </div>
  
  <!-- CONTAINER TABLE -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        
        <!-- MAIN CONTENT CARD -->
        <!--[if (gte mso 9)|(IE)]>
          <table align="center" border="0" cellspacing="0" cellpadding="0" width="600" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 600px;">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- HEADER -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px; background-color: #1e293b; border-radius: 8px 8px 0 0;">
               <h1 style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #ffffff;">
                 Ark LMS
               </h1>
            </td>
          </tr>
          
          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 600; color: #0f172a;">
                Hello ${displayName},
              </h2>
              
              <p style="margin: 0 0 30px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; color: #475569;">
                We received a request to reset your password. Click the button below to create a new one. This link will expire in 1 hour for your security.
              </p>
              
              <!-- BUTTON -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: auto;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: #2563eb;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- FALLBACK LINK -->
              <p style="margin: 30px 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: #64748b;">
                Button not working? Paste the following link into your browser:
              </p>
              <p style="margin: 5px 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #2563eb; word-break: break-all;">
                 <a href="${resetLink}" style="color: #2563eb; text-decoration: underline;">${resetLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f1f5f9; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #64748b; text-align: center;">
                If you did not request a password reset, please ignore this email or contact support if you have questions.
              </p>
              <p style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #94a3b8; text-align: center;">
                &copy; ${new Date().getFullYear()} Ark Learning Management System. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
        <!--[if (gte mso 9)|(IE)]>
          </table>
        <![endif]-->
        
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
