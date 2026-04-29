"use client";

/**
 * useShiftTemplates Hook
 * Manages shift templates and bulk operations
 */

import { useState, useCallback } from "react";
import { shiftTemplateService, DEFAULT_TEMPLATES } from "@/lib/services";
import { Shift, BulkShiftOperation, ApplyTemplateResult, TemplatePreview, ShiftTemplate } from "@/lib/types";

export interface UseShiftTemplatesReturn {
  templates: Omit<ShiftTemplate, "id" | "createdAt" | "updatedAt">[];
  applyTemplate: (operation: BulkShiftOperation) => Promise<ApplyTemplateResult>;
  previewTemplate: (operation: BulkShiftOperation) => TemplatePreview[];
  isApplying: boolean;
  applicationResult: ApplyTemplateResult | null;
}

export function useShiftTemplates(branchId?: string): UseShiftTemplatesReturn {
  const [isApplying, setIsApplying] = useState(false);
  const [applicationResult, setApplicationResult] = useState<ApplyTemplateResult | null>(null);

  // Get templates for branch
  const templates = branchId
    ? shiftTemplateService.getTemplatesForBranch(branchId)
    : DEFAULT_TEMPLATES;

  const applyTemplate = useCallback(
    async (operation: BulkShiftOperation): Promise<ApplyTemplateResult> => {
      setIsApplying(true);
      try {
        const result = await shiftTemplateService.applyBulkOperation(operation);
        setApplicationResult(result);
        return result;
      } finally {
        setIsApplying(false);
      }
    },
    []
  );

  const previewTemplate = useCallback(
    (operation: BulkShiftOperation): TemplatePreview[] => {
      return shiftTemplateService.previewBulkOperation(operation);
    },
    []
  );

  return {
    templates,
    applyTemplate,
    previewTemplate,
    isApplying,
    applicationResult,
  };
}
