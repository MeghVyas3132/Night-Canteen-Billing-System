import { redirect } from "next/navigation";

// Admin home → the live order board.
export default function AdminIndex() {
  redirect("/admin/orders");
}
