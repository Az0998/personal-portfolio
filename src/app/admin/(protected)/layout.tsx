import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect("/admin");
  }

  return <>{children}</>;
}
