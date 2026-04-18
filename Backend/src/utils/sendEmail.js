import { ApiError } from './apiError.js'

const RESEND_API_URL = 'https://api.resend.com/emails'

const sendEmail = async ({ to, subject, html }) => {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.MAIL_FROM

    if (!apiKey || !from) {
        throw new ApiError(500, 'Email service is not configured')
    }

    const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to,
            subject,
            html,
        }),
    })

    const payload = await response.json()

    if (!response.ok) {
        const errorMessage = payload?.message || payload?.error?.message || 'Failed to send email'
        throw new ApiError(response.status || 500, errorMessage)
    }

    return payload
}

const sendPasswordResetEmail = async ({ email, resetUrl, name }) => {
    const safeName = name || 'there'

    return sendEmail({
        to: email,
        subject: 'Reset your password',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin-bottom: 12px;">Reset your password</h2>
                <p>Hello ${safeName},</p>
                <p>We received a request to reset your password. Use the link below to set a new password.</p>
                <p style="margin: 24px 0;">
                    <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 8px; display: inline-block;">
                        Reset Password
                    </a>
                </p>
                <p>This link expires in 15 minutes and can be used only once.</p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>
        `,
    })
}

export { sendEmail, sendPasswordResetEmail }
