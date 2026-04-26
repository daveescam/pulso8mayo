import { TransferList } from "@/components/inventory/transfer-list";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function TransfersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const branchId = (session.user as any).branchId || "";
  
  const allBranches = await db.select({
    id: branches.id,
    name: branches.name,
  }).from(branches);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <TransferList branchId={branchId} branches={allBranches} />
    </div>
  );
}
