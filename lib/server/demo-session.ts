import { cookies } from "next/headers";

export const DEMO_ID_COOKIE = "demo_identity";

export interface DemoIdentity {
  userId: string;
  companyId: string;
}

function sanitizeIdentity(raw: string | undefined): string | null {
  if (!raw) return null;
  return /^[a-zA-Z0-9_-]{8,80}$/.test(raw) ? raw : null;
}

export async function getDemoIdentity(): Promise<DemoIdentity> {
  const cookieStore = await cookies();
  const rawIdentity = sanitizeIdentity(cookieStore.get(DEMO_ID_COOKIE)?.value);
  const identity = rawIdentity || crypto.randomUUID();

  if (!rawIdentity) {
    cookieStore.set(DEMO_ID_COOKIE, identity, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return {
    userId: `demo-user-${identity}`,
    companyId: `demo-company-${identity}`,
  };
}
