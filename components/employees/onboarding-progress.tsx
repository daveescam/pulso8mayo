"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, Circle, Clock, User, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface OnboardingStep {
  id: string;
  name: string;
  category: "DOCUMENTS" | "TRAINING" | "SETUP" | "COMPLIANCE" | "ORIENTATION";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "BLOCKED";
  dueDate?: Date;
  completedDate?: Date;
}

export interface Onboarding {
  startDate: Date;
  targetEndDate?: Date;
  progress: number;
  buddyName?: string;
  mentorName?: string;
}

interface OnboardingProgressProps {
  onboarding: Onboarding;
  steps: OnboardingStep[];
  onCompleteStep: (stepId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  DOCUMENTS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  TRAINING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  SETUP: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  COMPLIANCE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  ORIENTATION: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

const STATUS_ICONS: Record<string, JSX.Element> = {
  PENDING: <Circle className="h-4 w-4 text-muted-foreground" />,
  IN_PROGRESS: <Clock className="h-4 w-4 text-yellow-600" />,
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-600" />,
  SKIPPED: <Circle className="h-4 w-4 text-gray-400" />,
  BLOCKED: <Circle className="h-4 w-4 text-red-600" />,
};

export function OnboardingProgress({
  onboarding,
  steps,
  onCompleteStep,
}: OnboardingProgressProps) {
  const completedSteps = steps.filter((s) => s.status === "COMPLETED").length;
  const totalSteps = steps.length;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Progress</CardTitle>
          <CardDescription>
            New employee onboarding checklist and progress tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {completedSteps} of {totalSteps} steps ({onboarding.progress}%)
              </span>
            </div>
            <Progress value={onboarding.progress} className="h-2" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {format(new Date(onboarding.startDate), "MMMM d, yyyy", { locale: es })}
              </p>
            </div>
            {onboarding.targetEndDate && (
              <div>
                <p className="text-muted-foreground">Target End Date</p>
                <p className="font-medium">
                  {format(new Date(onboarding.targetEndDate), "MMMM d, yyyy", { locale: es })}
                </p>
              </div>
            )}
          </div>

          {/* Buddy/Mentor */}
          {(onboarding.buddyName || onboarding.mentorName) && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Support Team</p>
              <div className="flex gap-3">
                {onboarding.buddyName && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-accent flex-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Buddy</p>
                      <p className="text-sm font-medium">{onboarding.buddyName}</p>
                    </div>
                  </div>
                )}
                {onboarding.mentorName && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-accent flex-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mentor</p>
                      <p className="text-sm font-medium">{onboarding.mentorName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Checklist</CardTitle>
          <CardDescription>
            Complete all required onboarding steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(["DOCUMENTS", "TRAINING", "SETUP", "COMPLIANCE", "ORIENTATION"] as const).map(
              (category) => {
                const categorySteps = steps.filter((s) => s.category === category);
                if (categorySteps.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={CATEGORY_COLORS[category]}
                        variant="secondary"
                      >
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {categorySteps.filter((s) => s.status === "COMPLETED").length}/
                        {categorySteps.length} completed
                      </span>
                    </div>

                    <div className="space-y-2">
                      {categorySteps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {STATUS_ICONS[step.status]}
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  step.status === "COMPLETED"
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {step.name}
                              </p>
                              {step.dueDate && (
                                <p className="text-xs text-muted-foreground">
                                  Due:{" "}
                                  {format(new Date(step.dueDate), "MMM d, yyyy", { locale: es })}
                                </p>
                              )}
                              {step.completedDate && (
                                <p className="text-xs text-green-600">
                                  Completed:{" "}
                                  {format(new Date(step.completedDate), "MMM d, yyyy", {
                                    locale: es,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>

                          {step.status !== "COMPLETED" && step.status !== "SKIPPED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCompleteStep(step.id)}
                              disabled={step.status === "BLOCKED"}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(["DOCUMENTS", "TRAINING", "SETUP", "COMPLIANCE", "ORIENTATION"] as const).map(
              (category) => {
                const categorySteps = steps.filter((s) => s.category === category);
                const completedCount = categorySteps.filter(
                  (s) => s.status === "COMPLETED"
                ).length;
                const totalCount = categorySteps.length;

                return (
                  <div key={category} className="text-center">
                    <Badge
                      className={CATEGORY_COLORS[category]}
                      variant="secondary"
                      className="mb-2"
                    >
                      {category}
                    </Badge>
                    <p className="text-2xl font-bold mt-2">
                      {completedCount}/{totalCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {totalCount > 0
                        ? `${Math.round((completedCount / totalCount) * 100)}% complete`
                        : "No steps"}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
