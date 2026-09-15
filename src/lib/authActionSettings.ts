import { 
  Auth, 
  User, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  verifyBeforeUpdateEmail,
  ActionCodeSettings
} from 'firebase/auth';

/**
 * Sends a password reset email directly via Firebase Authentication.
 */
export async function safeSendPasswordResetEmail(auth: Auth, email: string, actionCodeSettings?: ActionCodeSettings) {
  try {
    if (actionCodeSettings) {
      try {
        return await sendPasswordResetEmail(auth, email, actionCodeSettings);
      } catch (e) {
        console.warn('ActionCodeSettings reset failed, trying standard send:', e);
      }
    }
    return await sendPasswordResetEmail(auth, email);
  } catch (err: any) {
    console.error('Firebase sendPasswordResetEmail error:', err?.code, err?.message);
    throw err;
  }
}

/**
 * Sends an email verification link directly via Firebase Authentication.
 */
export async function safeSendEmailVerification(user: User, actionCodeSettings?: ActionCodeSettings) {
  try {
    if (actionCodeSettings) {
      try {
        return await sendEmailVerification(user, actionCodeSettings);
      } catch (e) {
        console.warn('ActionCodeSettings verification failed, trying standard send:', e);
      }
    }
    return await sendEmailVerification(user);
  } catch (err: any) {
    console.error('Firebase sendEmailVerification error:', err?.code, err?.message);
    throw err;
  }
}

/**
 * Sends an email update verification link.
 */
export async function safeVerifyBeforeUpdateEmail(user: User, newEmail: string, actionCodeSettings?: ActionCodeSettings) {
  try {
    if (actionCodeSettings) {
      try {
        return await verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings);
      } catch (e) {
        console.warn('ActionCodeSettings email update failed, trying standard send:', e);
      }
    }
    return await verifyBeforeUpdateEmail(user, newEmail);
  } catch (err: any) {
    console.error('Firebase verifyBeforeUpdateEmail error:', err?.code, err?.message);
    throw err;
  }
}
