import { redirectToDashboard } from "@/lib/auth/current";

export default async function DashboardPage() {
  await redirectToDashboard();
}
