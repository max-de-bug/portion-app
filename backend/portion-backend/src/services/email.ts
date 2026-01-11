import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] Skipping welcome email: RESEND_API_KEY not set");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Portion <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Portion! 🚀",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
          <h1 style="color: #059669;">You're on the list!</h1>
          <p>Thank you for subscribing to Portion updates. We're excited to have you with us.</p>
          <p>Portion is the future of yield-powered payments for AI agents. By being on our waitlist, you'll be among the first to know when we launch and get early access eligibility.</p>
          <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7;">
            <p style="margin: 0; font-weight: 600;">What's next?</p>
            <ul style="margin-top: 10px; padding-left: 20px;">
              <li>Stay tuned for our official launch announcement</li>
              <li>Follow us on X for real-time updates</li>
              <li>Keep an eye on your inbox for early access invites</li>
            </ul>
          </div>
          <p style="font-size: 0.875rem; color: #666;">This is an automated message. You can unsubscribe at any time.</p>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error };
    }

    console.log(`[Email] Welcome email sent to ${email}:`, data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { success: false, error };
  }
};
