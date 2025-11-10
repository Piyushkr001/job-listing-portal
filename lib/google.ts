// lib/google.ts
import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUser | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: !!payload.email_verified,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error("verifyGoogleIdToken error:", err);
    return null;
  }
}
