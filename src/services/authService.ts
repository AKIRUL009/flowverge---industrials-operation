import { db } from '../database.ts';

export interface FirebaseIdentity {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

export interface ResolvedUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  role_id: number;
  status: string;
  phone_verified: boolean;
}

export function resolveFlowvergeUser(identity: FirebaseIdentity): ResolvedUser | null {
  if (!identity.email) {
    return null; // Cannot map without email currently
  }

  // Temporary mapping by verified email until schema is updated with firebase_uid
  const user = db.prepare(`
    SELECT u.*, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.email = ?
  `).get(identity.email);

  if (!user) {
    return null;
  }

  // Map to normalized user object
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    role_id: user.role_id,
    status: user.status,
    phone_verified: Boolean(user.phone_verified)
  };
}
