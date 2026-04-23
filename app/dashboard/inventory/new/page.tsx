import { ProductForm } from "@/components/inventory/product-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

import { getSuppliers } from "@/app/actions/inventory";

export default async function NewProductPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect("/login");
    }

    const suppliers = await getSuppliers(session.user.companyId as string);

    return (
        <div className="max-w-7xl mx-auto p-6">
            <ProductForm suppliers={suppliers} />
        </div>
    );
}
