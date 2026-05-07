import { cookies } from "next/headers";
import { supabase } from "./supabase";

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

export async function ensureDemoCompany(companyId: string): Promise<void> {
  const { error } = await supabase
    .from("companies")
    .upsert(
      {
        id: companyId,
        legal_name: "Empresa sin configurar",
        rut: "Pendiente",
        legal_type: "Pendiente",
        tax_regime: "Pendiente",
        lifecycle_stage: "exploration",
        representative_name: "Pendiente",
        representative_rut: "Pendiente",
        industry: "Pendiente",
        municipality: "Pendiente",
      },
      { onConflict: "id" }
    );

  if (error) {
    throw new Error(`Error preparando empresa demo: ${error.message}`);
  }
}

export async function getDemoIdentityWithCompany(): Promise<DemoIdentity> {
  const identity = await getDemoIdentity();
  await ensureDemoCompany(identity.companyId);
  return identity;
}
