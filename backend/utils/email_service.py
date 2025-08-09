import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class EmailService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.client = SendGridAPIClient(self.api_key) if self.api_key else None
        self.sender_email = os.environ.get('SENDER_EMAIL', 'noreply@yourdomain.com')

    def send_email(self, to_email, subject, html_content):
        if not self.client:
            print("⚠️ EmailService: SendGrid API key not configured. Skipping email send.")
            return False

        message = Mail(
            from_email=self.sender_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        try:
            response = self.client.send(message)
            print(f"✅ Email sent to {to_email}, status code: {response.status_code}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {e}")
            return False

    def send_verification_email(self, to_email, token):
        # TODO: Use a proper HTML template
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        verification_link = f"{frontend_url}/verify-email?token={token}"
        subject = "Verify your email for WeWear"
        html_content = f"""
        <h2>Welcome to WeWear!</h2>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">Verify Email</a></p>
        <p>If you did not sign up for this account, you can ignore this email.</p>
        """
        return self.send_email(to_email, subject, html_content)

    def send_password_reset_email(self, to_email, token):
        # TODO: Use a proper HTML template
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password?token={token}"
        subject = "Your WeWear Password Reset Request"
        html_content = f"""
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        """
        return self.send_email(to_email, subject, html_content)
