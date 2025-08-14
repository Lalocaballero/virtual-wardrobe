import os
import brevo_python
from brevo_python.api import transactional_emails_api
from brevo_python import SendSmtpEmail, SendSmtpEmailSender, SendSmtpEmailTo

class EmailService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.sender_email = os.environ.get('SENDER_EMAIL', 'wewearappoficial@gmail.com')
        
        if self.api_key:
            self.configuration = brevo_python.Configuration()
            self.configuration.api_key['api-key'] = self.api_key
            self.api_instance = transactional_emails_api.TransactionalEmailsApi(
                brevo_python.ApiClient(self.configuration)
            )
        else:
            self.api_instance = None

    def send_email(self, to_email, subject, html_content):
        if not self.api_instance:
            print("⚠️ EmailService: Brevo API key not configured. Skipping email send.")
            return False

        sender = SendSmtpEmailSender(email=self.sender_email, name="WeWear App")
        to = [SendSmtpEmailTo(email=to_email)]
        
        send_smtp_email = SendSmtpEmail(
            sender=sender,
            to=to,
            html_content=html_content,
            subject=subject
        )

        try:
            api_response = self.api_instance.send_transac_email(send_smtp_email)
            print(f"✅ Email sent to {to_email} via Brevo. Response: {api_response}")
            return True
        except brevo_python.ApiException as e:
            print(f"❌ Failed to send email to {to_email} via Brevo: {e}")
            return False

    def send_verification_email(self, to_email, token):
        backend_url = os.environ.get('BACKEND_URL', 'http://localhost:5000')
        verification_link = f"{backend_url}/api/verify-email?token={token}"
        subject = "Verify your email for WeWear"
        html_content = f"""
        <h2>Welcome to WeWear!</h2>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">Verify Email</a></p>
        <p>If you did not sign up for this account, you can ignore this email.</p>
        """
        return self.send_email(to_email, subject, html_content)

    def send_password_reset_email(self, to_email, token):
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

    def send_suspension_email(self, to_email, suspension_end_date, reason):
        subject = "Your WeWear Account Has Been Suspended"
        html_content = f"""
        <h2>Account Suspension Notice</h2>
        <p>Your WeWear account has been temporarily suspended.</p>
        <p><strong>Reason:</strong> {reason}</p>
        <p>Your suspension will last until: <strong>{suspension_end_date.strftime('%B %d, %Y at %I:%M %p UTC')}</strong>.</p>
        <p>You will not be able to log in until the suspension period is over.</p>
        <p>If you believe this is a mistake, please contact our support team.</p>
        """
        return self.send_email(to_email, subject, html_content)

    def send_ban_email(self, to_email, reason):
        subject = "Your WeWear Account Has Been Banned"
        html_content = f"""
        <h2>Account Ban Notice</h2>
        <p>Your WeWear account has been permanently banned.</p>
        <p><strong>Reason:</strong> {reason}</p>
        <p>This action is irreversible. You will no longer be able to access your account or its data.</p>
        <p>If you believe this is a mistake, please contact our support team.</p>
        """
        return self.send_email(to_email, subject, html_content)
