"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";

const personalInfoSchema = z.object({
  dateOfBirth: z.string().optional(),
  curp: z.string().max(18, "CURP must be 18 characters").optional(),
  rfc: z.string().max(13, "RFC must be 13 characters").optional(),
  nss: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "COMMON_LAW"]).optional(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  nationality: z.string(),
});

const contactInfoSchema = z.object({
  personalEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  personalPhone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    exteriorNumber: z.string().optional(),
    interiorNumber: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const emergencyContactSchema = z.object({
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  emergencyContactRelationship: z.string().optional(),
});

const bankInfoSchema = z.object({
  bankName: z.string().optional(),
  clabe: z.string().max(18, "CLABE must be 18 digits").optional(),
  paymentMethod: z.enum(["BANK_TRANSFER", "CHECK", "CASH", "PAYROLL_CARD"]).optional(),
});

const combinedSchema = personalInfoSchema.merge(contactInfoSchema).merge(emergencyContactSchema).merge(bankInfoSchema);

type PersonalInfoFormValues = z.infer<typeof combinedSchema>;

interface PersonalInfoFormProps {
  employeeId: string;
  initialData?: Partial<PersonalInfoFormValues>;
  onSuccess?: () => void;
  isEditMode?: boolean;
}

const MEXICAN_BANKS = [
  "BBVA México",
  "Banamex",
  "Banorte",
  "HSBC",
  "Santander",
  "Inbursa",
  "Banco Azteca",
  "Banregio",
  "Scotiabank",
  "IXE Banco",
  "Mi Banco",
  "Banco Finsus",
  "BanCoppel",
  "Nu México",
  "Mercado Pago",
  "RappiCard",
  "Otro",
];

export function PersonalInfoForm({ employeeId, initialData, onSuccess, isEditMode = false }: PersonalInfoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(isEditMode);

  const t = useTranslations("labor.employees");
  const tCommon = useTranslations("common");

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      dateOfBirth: "",
      curp: "",
      rfc: "",
      nss: "",
      gender: undefined,
      maritalStatus: undefined,
      bloodType: undefined,
      nationality: "MEXICANA",
      personalEmail: "",
      personalPhone: "",
      address: {
        street: "",
        exteriorNumber: "",
        interiorNumber: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
      city: "",
      state: "",
      zipCode: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactEmail: "",
      emergencyContactRelationship: "",
      bankName: "",
      clabe: "",
      paymentMethod: "BANK_TRANSFER",
      ...initialData,
    },
  });

  async function onSubmit(data: PersonalInfoFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee profile");
      }

      toast.success(t("saveSuccess"));
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast.error(t("saveError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("personalInfo.title")}</CardTitle>
          <CardDescription>
            {t("personalInfo.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalInfo.dateOfBirth")}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalInfo.gender.label")}</FormLabel>
                  <Select
                    disabled={!isEditing || isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("personalInfo.gender.placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MALE">{t("personalInfo.gender.male")}</SelectItem>
                      <SelectItem value="FEMALE">{t("personalInfo.gender.female")}</SelectItem>
                      <SelectItem value="OTHER">{t("personalInfo.gender.other")}</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">{t("personalInfo.gender.preferNotToSay")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="curp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalInfo.curp.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("personalInfo.curp.placeholder")}
                      maxLength={18}
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("personalInfo.curp.description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rfc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalInfo.rfc.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("personalInfo.rfc.placeholder")}
                      maxLength={13}
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("personalInfo.rfc.description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalInfo.nss.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("personalInfo.nss.placeholder")}
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("personalInfo.nss.description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalInfo.maritalStatus.label")}</FormLabel>
                  <Select
                    disabled={!isEditing || isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("personalInfo.maritalStatus.placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SINGLE">{t("personalInfo.maritalStatus.single")}</SelectItem>
                      <SelectItem value="MARRIED">{t("personalInfo.maritalStatus.married")}</SelectItem>
                      <SelectItem value="DIVORCED">{t("personalInfo.maritalStatus.divorced")}</SelectItem>
                      <SelectItem value="WIDOWED">{t("personalInfo.maritalStatus.widowed")}</SelectItem>
                      <SelectItem value="COMMON_LAW">{t("personalInfo.maritalStatus.commonLaw")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloodType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalInfo.bloodType.label")}</FormLabel>
                  <Select
                    disabled={!isEditing || isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("personalInfo.bloodType.placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalInfo.nationality")}</FormLabel>
                  <FormControl>
                    <Input disabled={!isEditing || isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("contactInfo.title")}</CardTitle>
          <CardDescription>
            {t("contactInfo.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="personalEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactInfo.personalEmail.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("contactInfo.personalEmail.placeholder")}
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactInfo.personalPhone.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("contactInfo.personalPhone.placeholder")}
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t("contactInfo.address.title")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contactInfo.address.street")}</FormLabel>
                    <FormControl>
                      <Input disabled={!isEditing || isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.exteriorNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contactInfo.address.exteriorNumber")}</FormLabel>
                      <FormControl>
                        <Input disabled={!isEditing || isLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.interiorNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contactInfo.address.interiorNumber")}</FormLabel>
                      <FormControl>
                        <Input disabled={!isEditing || isLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="address.neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contactInfo.address.neighborhood")}</FormLabel>
                    <FormControl>
                      <Input disabled={!isEditing || isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contactInfo.address.city")}</FormLabel>
                    <FormControl>
                      <Input disabled={!isEditing || isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contactInfo.address.state")}</FormLabel>
                    <FormControl>
                      <Input disabled={!isEditing || isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address.zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactInfo.address.zipCode.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("contactInfo.address.zipCode.placeholder")}
                      maxLength={5}
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("emergencyContact.title")}</CardTitle>
          <CardDescription>
            {t("emergencyContact.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("emergencyContact.name.label")}</FormLabel>
                  <FormControl>
                    <Input disabled={!isEditing || isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("emergencyContact.phone")}</FormLabel>
                  <FormControl>
                    <Input disabled={!isEditing || isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergencyContactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("emergencyContact.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactRelationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("emergencyContact.relationship.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("emergencyContact.relationship.placeholder")}
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

        {/* Bank Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bank Information</CardTitle>
            <CardDescription>
              Bank account details for payroll (HR/Managers only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <Select
                      disabled={!isEditing || isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEXICAN_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      disabled={!isEditing || isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="PAYROLL_CARD">Payroll Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="clabe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CLABE (18 digits)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="18 digit bank account number"
                      maxLength={18}
                      disabled={!isEditing || isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Interbank Clave Uniforme de Bancos (18 digits)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {!isEditing && !isEditMode && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            {t("editButton")}
          </Button>
        )}
        {isEditing && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                form.reset(initialData);
              }}
              disabled={isLoading}
            >
              {t("cancelButton")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("saveButton")}
                </>
              )}
            </Button>
          </>
        )}
      </div>
      </form>
    </Form>
  );
}
