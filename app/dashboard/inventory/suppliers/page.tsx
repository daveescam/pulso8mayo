import { Suspense } from "react";
import { SupplierList } from "@/components/inventory/supplier-list";
import { Loader2 } from "lucide-react";

export default function SuppliersPage() {
    return (
        <div className="flex-1 space-y-4 p-4 lg:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Proveedores</h1>
            </div>
            <Suspense fallback={
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            }>
                <SupplierList />
            </Suspense>
        </div>
    );
}
