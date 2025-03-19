// pages/api/processEmails.js

import { adminDb } from '../../../lib/firebaseAdmin'; // Firebase setup
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'ssl0.ovh.net',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_SERVER_USERNAME,
    pass: process.env.SMTP_SERVER_PASSWORD,
  },
});

// Function to send an email
const sendEmail = async (to, subject, htmlContent) => {
  return await transporter.sendMail({
    from: `ASHE™ <${process.env.SMTP_SERVER_USERNAME}>`,
    to,
    subject,
    html: htmlContent,
  });
};

export default async function handler(req, res) {
  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    const jobRef = adminDb.collection('email_jobs').doc(jobId);
    const jobSnapshot = await jobRef.get();

    if (!jobSnapshot.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const jobData = jobSnapshot.data();
    const { emails, subject, htmlContent } = jobData;

    // Process remaining emails in batches
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      for (const email of batch) {
        try {
          await sendEmail(email, subject, htmlContent);
        } catch (error) {
          console.error(`Failed to send to ${email}:`, error);
        }
      }
    }

    // Mark the job as completed
    await jobRef.update({ status: 'completed' });

    return res.status(200).json({ message: 'Emails processed successfully' });
  } catch (error) {
    console.error('Error processing emails:', error);
    return res.status(500).json({ error: 'Failed to process email job' });
  }
}
