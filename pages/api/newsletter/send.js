// pages/api/sendEmail.js

import nodemailer from 'nodemailer';
import { adminDb } from '../../../lib/firebaseAdmin'; // Firebase setup

// Create a reusable Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'ssl0.ovh.net', // your SMTP provider's host
  port: 465, // SMTP port
  secure: true, // Use SSL
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

// Store email job in Firestore
const storeEmailJob = async (emails, subject, htmlContent) => {
  const jobRef = adminDb.collection('email_jobs').doc();
  await jobRef.set({
    emails,
    subject,
    htmlContent,
    status: 'queued', // Track the job status
  });
  return jobRef.id; // Return the job ID for background processing
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emails, htmlContent, subject } = req.body;

  if (!emails || !htmlContent || !subject) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const batchSize = 4; // Process the first 5 emails
    const firstBatch = emails.slice(0, Math.min(batchSize, emails.length));
    const remainingEmails = emails.slice(Math.min(batchSize, emails.length));

    // Send first batch immediately
    let sentCount = 0;
    for (const email of firstBatch) {
      try {
        await sendEmail(email, subject, htmlContent);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error);
      }
    }

    // If there are remaining emails, queue them for background processing
    if (remainingEmails.length > 0) {
      const jobId = await storeEmailJob(remainingEmails, subject, htmlContent);

      // Trigger background processing (this could be an HTTP call to another route or worker)
      await triggerBackgroundProcessing(jobId);
    }

    return res.status(200).json({
      success: true,
      message: `Sent ${sentCount} emails immediately. Queued ${remainingEmails.length} emails for background processing.`,
      jobId: remainingEmails.length > 0 ? jobId : null,
    });
  } catch (error) {
    console.error('Error in email sender:', error);
    return res.status(500).json({ error: 'Failed to process email request' });
  }
}

// This function can be used to trigger background processing
const triggerBackgroundProcessing = async (jobId) => {
  // Example: an external trigger like HTTP request or cron job
  await fetch(`/api/newsletter/processEmails?jobId=${jobId}`);
};
