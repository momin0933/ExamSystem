import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        const { to, name, userId, password } = await req.json();

        if (!to) throw new Error("Recipient email is required");

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const subject = "Fashion Tex Recruitment Test Credentials";

        const text = `Dear ${name},

Greetings from Fashion Tex.

As part of our recruitment process, please find below the link to the test and your login credentials.

Website link: https://example.com/test-link
Username: ${userId}
Password: ${password}

Important:
- This is a timed test. Your time starts when you click the start button.
- Please do NOT use ChatGPT or any AI tool to answer the questions. We expect your own work.

If you face any issues, reply to this email or call 01713221549

Best regards,
Human Resources
Fashion Tex`;

        const html = `<p>Dear ${name},</p>
<p>Greetings from <strong>Fashion Tex</strong>.</p>
<p>As part of our recruitment process, please find below the link to the test and your login credentials.</p>
<p>
Website link: <a href="https://example.com/test-link">https://example.com/test-link</a><br/>
Username: <strong>${userId}</strong><br/>
Password: <strong>${password}</strong>
</p>
<p><strong>Important:</strong><br/>
- This is a timed test. Your time starts when you click the start button.<br/>
- Please do NOT use ChatGPT or any AI tool to answer the questions. We expect your own work.
</p>
<p>If you face any issues, reply to this email or call <strong>01713221549</strong></p>
<p>Best regards,<br/>
Human Resources<br/>
Fashion Tex</p>`;

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent:", info.response);

        return new Response(JSON.stringify({ message: "Email sent successfully" }), { status: 200 });
    } catch (error) {
        console.error("Email error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
