"use client";

import { useState, useCallback, useMemo } from "react";
import { Shift, LFTViolation, ValidationResult } from "@/lib/types/shifts";
import { validateShift as validateShiftAction, validateShifts as validateShiftsAction } from "@/app/actions/shifts";

export interface ValidationState {
  errors: LFTViolation[];
  warnings: LFTViolation[];
  isValidating: boolean;
  isValid: boolean;
}

export interface UseShiftValidationReturn {
  validationState: ValidationState;
  validateShift: (shift: Shift, existingShifts?: Shift[]) => Promise<ValidationResult>;
  validateShifts: (shifts: Shift[]) => Promise<ValidationResult>;
  clearValidation: () => void;
  conflictSummary: {
    hasConflicts: boolean;
    errorCount: number;
    warningCount: number;
    total: number;
  };
}

export function useShiftValidation(): UseShiftValidationReturn {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: [],
    warnings: [],
    isValidating: false,
    isValid: true,
  });

  const validateShift = useCallback(
    async (shift: Shift, existingShifts: Shift[] = []): Promise<ValidationResult> => {
      setValidationState((prev) => ({ ...prev, isValidating: true }));

      const result = await validateShiftAction(shift, existingShifts);

      setValidationState({
        errors: result.errors,
        warnings: result.warnings,
        isValidating: false,
        isValid: result.isValid,
      });

      return result;
    },
    []
  );

  const validateShifts = useCallback(async (shifts: Shift[]): Promise<ValidationResult> => {
    setValidationState((prev) => ({ ...prev, isValidating: true }));

    const result = await validateShiftsAction(shifts);

    setValidationState({
      errors: result.errors,
      warnings: result.warnings,
      isValidating: false,
      isValid: result.isValid,
    });

    return result;
  }, []);

  const clearValidation = useCallback(() => {
    setValidationState({
      errors: [],
      warnings: [],
      isValidating: false,
      isValid: true,
    });
  }, []);

  const conflictSummary = useMemo(() => {
    const errorCount = validationState.errors.length;
    const warningCount = validationState.warnings.length;
    const total = errorCount + warningCount;

    return {
      hasConflicts: total > 0,
      errorCount,
      warningCount,
      total,
    };
  }, [validationState.errors, validationState.warnings]);

  return {
    validationState,
    validateShift,
    validateShifts,
    clearValidation,
    conflictSummary,
  };
}
