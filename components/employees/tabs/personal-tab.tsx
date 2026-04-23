"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { format } from "date-fns";

interface PersonalTabProps {
  profile: any;
}

const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

const maritalStatusLabels: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
  COMMON_LAW: "Common Law",
};

const bloodTypeLabels: Record<string, string> = {
  "A+": "A+",
  "A-": "A-",
  "B+": "B+",
  "B-": "B-",
  "AB+": "AB+",
  "AB-": "AB-",
  "O+": "O+",
  "O-": "O-",
};

const paymentMethodLabels: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CHECK: "Check",
  CASH: "Cash",
  PAYROLL_CARD: "Payroll Card",
};

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm font-medium">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </div>
    </div>
  );
}

export function PersonalTab({ profile }: PersonalTabProps) {
  const address = profile.address as any;

  return (
    <div className="space-y-6">
      {/* Personal Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Basic personal information and identification documents.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoField
              label="Date of Birth"
              value={
                profile.dateOfBirth
                  ? format(new Date(profile.dateOfBirth), "MMMM d, yyyy")
                  : null
              }
            />
            <InfoField label="CURP" value={profile.curp} />
            <InfoField label="RFC" value={profile.rfc} />
            <InfoField label="NSS (Social Security)" value={profile.nss} />
            <InfoField
              label="Gender"
              value={profile.gender ? genderLabels[profile.gender] : null}
            />
            <InfoField
              label="Marital Status"
              value={profile.maritalStatus ? maritalStatusLabels[profile.maritalStatus] : null}
            />
            <InfoField
              label="Blood Type"
              value={profile.bloodType ? bloodTypeLabels[profile.bloodType] : null}
            />
            <InfoField label="Nationality" value={profile.nationality} />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Personal email, phone, and address.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <InfoField label="Personal Email" value={profile.personalEmail} />
            <InfoField label="Personal Phone" value={profile.personalPhone} />
          </div>

          {address && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Address</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <InfoField
                      label="Street"
                      value={`${address.street || ""} ${address.exteriorNumber || ""}${
                        address.interiorNumber ? ` Int. ${address.interiorNumber}` : ""
                      }`}
                    />
                  </div>
                  <InfoField label="Neighborhood" value={address.neighborhood} />
                  <InfoField label="City" value={address.city || profile.city} />
                  <InfoField label="State" value={address.state || profile.state} />
                  <InfoField label="ZIP Code" value={address.zipCode || profile.zipCode} />
                </div>
              </div>
            </>
          )}

          {!address && (
            <div className="text-sm text-muted-foreground italic">
              No address provided
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Contact person in case of emergency.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile.emergencyContactName ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InfoField label="Name" value={profile.emergencyContactName} />
              <InfoField label="Phone" value={profile.emergencyContactPhone} />
              <InfoField label="Email" value={profile.emergencyContactEmail} />
              <InfoField
                label="Relationship"
                value={profile.emergencyContactRelationship}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              No emergency contact provided
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bank Information</CardTitle>
              <CardDescription>Bank account details for payroll. (Restricted access)</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile.bankName ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField label="Bank" value={profile.bankName} />
              <InfoField label="CLABE" value={profile.clabe} />
              <InfoField
                label="Payment Method"
                value={
                  profile.paymentMethod
                    ? paymentMethodLabels[profile.paymentMethod]
                    : null
                }
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              No bank information provided
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
