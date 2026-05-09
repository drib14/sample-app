const verificationCodeTemplate = (code, type) => {
  const title = type === 'register' ? 'Verify your Registration' : 'Login Verification';
  const message = type === 'register'
    ? 'Thank you for starting your registration with Maki! Please use the following 6-digit code to complete your signup.'
    : 'Welcome back to Maki! Please use the following 6-digit code to securely log in to your account.';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdf8f6; color: #2b1c18; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
      .header { background-color: #a18072; padding: 30px 20px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
      .content { padding: 40px 30px; text-align: center; }
      .content p { font-size: 16px; line-height: 1.6; color: #846358; margin-bottom: 30px; }
      .code-box { background-color: #f2e8e5; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 30px; border: 2px dashed #a18072; }
      .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #43302b; margin: 0; }
      .footer { background-color: #fdf8f6; padding: 20px; text-align: center; font-size: 14px; color: #977669; }
      .footer a { color: #a18072; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        <p>${message}</p>
        <div class="code-box">
          <p class="code">${code}</p>
        </div>
        <p style="font-size: 14px; color: #977669;">This code will expire in 5 minutes. If you did not request this, please safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Maki. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

const welcomeTemplate = (firstName) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdf8f6; color: #2b1c18; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
      .header { background-color: #43302b; padding: 40px 20px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0; font-size: 28px; font-weight: bold; color: #eaddd7; }
      .content { padding: 40px 30px; }
      .content h2 { color: #43302b; font-size: 22px; margin-top: 0; }
      .content p { font-size: 16px; line-height: 1.6; color: #846358; margin-bottom: 20px; }
      .btn { display: inline-block; padding: 12px 30px; background-color: #a18072; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
      .footer { background-color: #fdf8f6; padding: 20px; text-align: center; font-size: 14px; color: #977669; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Maki!</h1>
      </div>
      <div class="content">
        <h2>Hi ${firstName},</h2>
        <p>We are absolutely thrilled to have you on board! Your Maki account has been successfully created.</p>
        <p>Maki is designed to provide you with a seamless, passwordless experience. No more forgetting passwords—just secure, fast access every time you need it.</p>
        <p>Ready to explore?</p>
        <a href="http://localhost:5173/dashboard" class="btn" style="color: #ffffff;">Go to Dashboard</a>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Maki. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  verificationCodeTemplate,
  welcomeTemplate
};
