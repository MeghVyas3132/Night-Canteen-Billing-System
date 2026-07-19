import { redirect } from "next/navigation";

// Admin home → menu management (the live order board arrives in M4).
export default function AdminIndex() {
  redirect("/admin/menu");
}
