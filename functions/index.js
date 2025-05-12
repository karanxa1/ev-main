const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Configure nodemailer with Gmail (using Firebase environment variables)
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const userEmail = user.email;
  const displayName = user.displayName || user.email.split('@')[0] || 'New User';
  const userId = user.uid;

  // Store basic user profile in Firestore
  const userProfile = {
    email: userEmail,
    displayName: displayName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection('users').doc(userId).set(userProfile);
    console.log(`User profile created in Firestore for UID: ${userId}`);
  } catch (error) {
    console.error(`Error creating user profile in Firestore for UID: ${userId}:`, error);
  }

  // Send Welcome Email (simplified)
  const mailOptions = {
    from: `"EV Charging Network" <${functions.config().gmail.email}>`,
    to: userEmail,
    subject: `🎉 Welcome to EV Charging Network, ${displayName}!</code>`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h1 style="color: #4CAF50; text-align: center;">Welcome aboard, ${displayName}!</h1>
          <p>Thank you for signing up for EV Charging Network. We're thrilled to have you join our community of EV enthusiasts.</p>
          <p>You can start by exploring charging stations, planning your trips, and more!</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <br>
          <p>Happy Charging!</p>
          <p><strong>The EV Charging Network Team</strong></p>
        </div>
      </div>
    `,
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to: ${userEmail}`);
  } catch (error) {
    console.error(`Error sending welcome email to ${userEmail}:`, error);
  }

  return null;
}); 