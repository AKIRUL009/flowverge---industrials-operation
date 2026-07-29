import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId
  });
}

export const adminAuth = getAuth();
