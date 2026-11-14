import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/dal";

export default async function ReportPage() {
  await requireStaff();
  redirect("/panel/nuevo");
}
