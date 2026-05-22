"use client";

import EmployeeDirectory from "@/components/employees/employee-directory";
import { useRequireRole } from "@/hooks/use-session";

export default function EmployeesPage() {
  const { loading } = useRequireRole(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR']);

  if (loading) {
    return null;
  }

  return <EmployeeDirectory />;
}
