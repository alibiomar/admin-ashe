import nodemailer from "nodemailer";

// Utility function to add a delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { emails, htmlContent,subject } = req.body;

  if (!emails || !htmlContent) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Configure OVH SMTP
  const transporter = nodemailer.createTransport({
    host: "ssl0.ovh.net", // OVH SMTP server
    port: 465, // OVH SMTP port
    secure: true, // Use SSL
    auth: {
      user: process.env.SMTP_SERVER_USERNAME, // Your OVH SMTP email
      pass: process.env.SMTP_SERVER_PASSWORD, // Your OVH SMTP password
    },
  });

  try {
    let successfulEmails = 0;
    let failedEmails = 0;

    // Send emails individually using a while loop
    let i = 0;
    while (i < emails.length) {
      const email = emails[i];
      try {
        await transporter.sendMail({
          from: `ASHE™ <${process.env.SMTP_SERVER_USERNAME}>`, // Sender address
          to: email, // Send to one recipient at a time
          subject: subject, // Email subject
          html: htmlContent, // HTML email content
        });
        successfulEmails++;
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        failedEmails++;
      }
      i++;

      // Add a 1-second delay between emails
      await delay(50); // Adjust the delay time as needed
    }

    res.status(200).json({
      message: `Emails sent successfully to ${successfulEmails} recipients. ${failedEmails} failed.`,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ error: "Failed to send emails" });
  }
}