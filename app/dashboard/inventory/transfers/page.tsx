"use client";

import * as React from "react";
import { TransferList } from "@/components/inventory/transfer-list";

export default function TransfersPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <TransferList />
        </div>
    );
}
