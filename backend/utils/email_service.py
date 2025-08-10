import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

class EmailService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.sender_email = os.environ.get('SENDER_EMAIL', 'wewearappoficial@gmail.com')
        
        if self.api_key:
            self.configuration = sib_api_v3_sdk.Configuration()
            self.configuration.api_key['api-key'] = self.api_key
            self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                sib_api_v3_sdk.ApiClient(self.configuration)
            )
        else:
            self.api_instance = None

    def send_email(self, to_email, subject, html_content):
        if not self.api_instance:
            print("⚠️ EmailService: Brevo API key not configured. Skipping email send.")
            return False

        sender = sib_api_v3_sdk.SendSmtpEmailSender(email=self.sender_email, name="WeWear App")
        to = [sib_api_v3_sdk.SendSmtpEmailTo(email=to_email)]
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            sender=sender,
            to=to,
            html_content=html_content,
            subject=subject
        )

        try:
            api_response = self.api_instance.send_transac_email(send_smtp_email)
            print(f"✅ Email sent to {to_email} via Brevo. Response: {api_response}")
            return True
        except ApiException as e:
            print(f"❌ Failed to send email to {to_email} via Brevo: {e}")
            return False

    def send_verification_email(self, to_email, token):
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
