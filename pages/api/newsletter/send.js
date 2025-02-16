import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { emails, htmlContent } = req.body;

  if (!emails || !htmlContent) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const transporter = nodemailer.createTransport({
    host: "ssl0.ovh.net", 
    port: 465, 
    secure: true, 
    auth: {
      user: process.env.SMTP_SERVER_USERNAME, 
      pass: process.env.SMTP_SERVER_PASSWORD, 
    },
  });

  try {
    // Send email to all subscribers
    await transporter.sendMail({
      from: `Your Company <${process.env.SMTP_SERVER_USERNAME}>`, 
      to: emails.join(", "), 
      subject: "Your Newsletter", 
      html: htmlContent, 
    });

    res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ error: "Failed to send emails" });
  }
}