"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, User, Briefcase, FileText, FolderOpen, Calendar, Clock, FileCheck } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { EmployeeHeader } from "@/components/employees/employee-header";
import { PersonalTab } from "@/components/employees/tabs/personal-tab";
import { ProfessionalTab } from "@/components/employees/tabs/professional-tab";
import { ContractsTab } from "@/components/employees/tabs/contracts-tab";
import { DocumentsTab } from "@/components/employees/tabs/documents-tab";
import { OnboardingTab } from "@/components/employees/tabs/onboarding-tab";
import { AttendanceTab } from "@/components/employees/tabs/attendance-tab";
import { AuditTab } from "@/components/employees/tabs/audit-tab";
import { toast } from "sonner";

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();

  const employeeId = params?.id as string;
  const defaultTab = searchParams?.get("tab") || "personal";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [profile, setProfile] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const companyId = session?.user?.companyId;

  const fetchEmployeeData = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      // Fetch profile with all related data
      const response = await fetch(
        `/api/employees/${employeeId}?includeContracts=true&includeSalary=true&includeOnboarding=true&includeBenefits=true&includeTraining=true&includeVacation=true`
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setContracts(data.data.contracts || []);
        setSalaryHistory(data.data.salaryHistory || []);
        setOnboarding(data.data.onboarding || null);
        setOnboardingSteps(data.data.onboarding?.steps || []);
      } else {
        toast.error("Employee not found");
        router.push("/dashboard/employees");
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("Error loading employee data");
    } finally {
      setLoading(false);
    }
  }, [employeeId, router]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const handleBack = () => {
    router.push("/dashboard/employees");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Employee Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The employee profile you're looking for doesn't exist.
        </p>
        <Button onClick={handleBack}>Back to Directory</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <EmployeeHeader
        employee={{
          id: profile.id,
          userName: profile.userName,
          userEmail: profile.userEmail,
          employeeNumber: profile.employeeNumber,
          employeeStatus: profile.employeeStatus,
          profilePhotoUrl: profile.profilePhotoUrl,
          position: profile.position,
          department: profile.department,
        }}
        onBack={handleBack}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden md:inline">Professional</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Contracts</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden md:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Onboarding</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden md:inline">Audit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalTab profile={profile} />
        </TabsContent>

        <TabsContent value="professional" className="mt-6">
          <ProfessionalTab profile={profile} />
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <ContractsTab contracts={contracts} salaryHistory={salaryHistory} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab documents={documents} employeeId={employeeId} />
        </TabsContent>

        <TabsContent value="onboarding" className="mt-6">
          <OnboardingTab onboarding={onboarding} steps={onboardingSteps} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceTab
            attendanceRecords={[]}
            vacationBalance={profile.totalVacationBalance}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditTab userId={profile.userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
