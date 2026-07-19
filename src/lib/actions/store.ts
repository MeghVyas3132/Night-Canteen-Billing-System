"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

/** Opens or closes the canteen (admin only). */
export async function setStoreOpen(
  isOpen: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }

  const { error } = await admin.supabase
    .from("store_settings")
    .update({
      is_open: isOpen,
      updated_at: new Date().toISOString(),
      updated_by: admin.user.id,
    })
    .eq("id", 1);
  if (error) return { ok: false, error: "Couldn't update store status." };

  await logAudit(admin.supabase, {
    actorId: admin.user.id,
    action: isOpen ? "store.open" : "store.close",
    entityType: "store",
    summary: isOpen ? "Opened the canteen" : "Closed the canteen",
  });

  revalidatePath("/");
  revalidatePath("/admin/orders");
  return { ok: true };
}
