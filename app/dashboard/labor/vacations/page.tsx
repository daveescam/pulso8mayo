"use client"

import { VacationManager } from "@/components/labor/vacation-manager"
import { use } from "react"

// This would typically come from your auth context
const COMPANY_ID = "company-id" // Replace with actual company ID from session

export default function VacationsPage() {
    return (
        <div className="space-y-6">
            <VacationManager 
                companyId={COMPANY_ID}
                canApprove={true}
            />
        </div>
    )
}
