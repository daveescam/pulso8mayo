"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Edit, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface ProfessionalTabProps {
  profile: any;
  onEdit?: () => void;
  canEdit?: boolean;
}

const statusLabels: Record<string, string> = {
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
  RESIGNED: "Resigned",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ONBOARDING: "secondary",
  ACTIVE: "default",
  ON_LEAVE: "outline",
  SUSPENDED: "destructive",
  TERMINATED: "destructive",
  RESIGNED: "destructive",
};

const terminationReasonLabels: Record<string, string> = {
  VOLUNTARY_RESIGNATION: "Voluntary Resignation",
  TERMINATION_WITH_CAUSE: "Termination with Cause",
  TERMINATION_WITHOUT_CAUSE: "Termination without Cause",
  CONTRACT_EXPIRED: "Contract Expired",
  RETIREMENT: "Retirement",
  DEATH: "Death",
  MUTUAL_AGREEMENT: "Mutual Agreement",
  OTHER: "Other",
};

function InfoField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm font-medium">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </div>
    </div>
  );
}

function DateField({ label, date }: { label: string; date: any }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm font-medium">
        {date ? (
          format(new Date(date), "MMM d, yyyy", { locale: es })
        ) : (
          <span className="text-muted-foreground italic">Not provided</span>
        )}
      </div>
    </div>
  );
}

export function ProfessionalTab({ profile, onEdit, canEdit }: ProfessionalTabProps) {
  // Calculate probation end date if not provided
  const probationEndDate = profile.probationEndDate
    ? new Date(profile.probationEndDate)
    : profile.hireDate
      ? addDays(new Date(profile.hireDate), 90)
      : null;

  const today = new Date();
  const isProbationActive = probationEndDate ? today < probationEndDate : false;

  // Calculate seniority
  const hireDate = profile.hireDate ? new Date(profile.hireDate) : null;
  const seniorityYears = hireDate
    ? Math.floor((today.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  return (
    <div className="space-y-6">
      {/* Employment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>Position, department, and employment information.</CardDescription>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoField label="Employee Number" value={profile.employeeNumber} />
            <InfoField label="Position" value={profile.position} />
            <InfoField label="Department" value={profile.department} />
            <DateField label="Hire Date" date={profile.hireDate} />
            <DateField label="Seniority Date" date={profile.seniorityDate} />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Seniority</Label>
              <div className="text-sm font-medium">
                {seniorityYears > 0 ? `${seniorityYears} year${seniorityYears !== 1 ? "s" : ""}` : "Less than 1 year"}
              </div>
            </div>
          </div>

          {probationEndDate && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Probation Period:</Label>
                <Badge variant={isProbationActive ? "secondary" : "outline"}>
                  {isProbationActive
                    ? `Ends ${format(probationEndDate, "MMM d, yyyy", { locale: es })}`
                    : `Completed ${format(probationEndDate, "MMM d, yyyy", { locale: es })}`}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Employment Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employment Status</CardTitle>
              <CardDescription>Current employment status and history.</CardDescription>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Update Status
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div>
                {profile.employeeStatus && (
                  <Badge variant={statusColors[profile.employeeStatus] || "outline"}>
                    {statusLabels[profile.employeeStatus] || profile.employeeStatus}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Active</Label>
              <div className="text-sm font-medium">
                <Badge variant={profile.isActive ? "default" : "destructive"}>
                  {profile.isActive ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            <InfoField
              label="Rehire Eligible"
              value={
                profile.rehireEligible !== null && profile.rehireEligible !== undefined
                  ? profile.rehireEligible
                    ? "Yes"
                    : "No"
                  : null
              }
            />
          </div>

          {profile.terminationDate && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DateField label="Termination Date" date={profile.terminationDate} />
                <InfoField
                  label="Termination Reason"
                  value={
                    profile.terminationReason
                      ? terminationReasonLabels[profile.terminationReason]
                      : null
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Work Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Work Schedule</CardTitle>
              <CardDescription>Standard work hours and shift assignment.</CardDescription>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              label="Standard Hours per Week"
              value={profile.standardHoursPerWeek || "Not specified"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills & Languages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Skills & Languages</CardTitle>
              <CardDescription>Employee skills and language proficiencies.</CardDescription>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Skills</Label>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">No skills added</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Languages</Label>
              <div className="flex flex-wrap gap-2">
                {profile.languages && profile.languages.length > 0 ? (
                  profile.languages.map((lang: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {lang}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">No languages added</span>
                )}
              </div>
            </div>
          </div>

          {profile.notes && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">HR Notes</Label>
                <div className="text-sm bg-muted p-3 rounded">
                  {profile.notes}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
