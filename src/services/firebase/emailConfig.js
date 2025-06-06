import { auth } from './config';
import { sendPasswordResetEmail } from 'firebase/auth';

/**
 * Configuration for Firebase Auth email actions
 */
const actionCodeSettings = {
  // URL to redirect to after the action is completed
  url: process.env.REACT_APP_DOMAIN || 'https://evmain.vercel.app',
  handleCodeInApp: true,
};

/**
 * Send password reset email with proper configuration
 */
export const sendPasswordResetEmailWithConfig = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export default actionCodeSettings; 