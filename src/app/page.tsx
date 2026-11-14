import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/dal";

export default async function HomePage() {
  await requireStaff();
  redirect("/panel");
}
