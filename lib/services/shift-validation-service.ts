/**
 * Shift Validation Service
 * Provides LFT (Ley Federal del Trabajo) compliance validation
 */

import { Shift, LFTViolation, ValidationResult } from "@/lib/types/shifts";
import { parseISO, startOfWeek, differenceInDays } from "date-fns";

export const LFT_LIMITS = {
  DAILY_HOURS: 8 * 60,
  WEEKLY_HOURS: 48 * 60,
  REST_BETWEEN_SHIFTS: 8 * 60,
  MAX_CONSECUTIVE_DAYS: 6,
} as const;

export class ShiftValidationService {
  validateShift(shift: Shift, existingShifts: Shift[] = []): ValidationResult {
    const errors: LFTViolation[] = [];
    const warnings: LFTViolation[] = [];

    const duration = this.getDuration(shift.startTime, shift.endTime);

    // Daily hours check
    if (duration > LFT_LIMITS.DAILY_HOURS) {
      errors.push({
        type: "DAILY_HOURS",
        severity: "error",
        message: `Turno excede 8 horas (${Math.floor(duration / 60)}h)`,
        shiftId: shift.id,
      });
    }

    // Overlap check
    const hasOverlap = existingShifts.some(
      (s) => s.shiftDate === shift.shiftDate && s.status !== "CANCELLED" && this.checkOverlap(shift, s)
    );

    if (hasOverlap) {
      errors.push({
        type: "SHIFT_OVERLAP",
        severity: "error",
        message: "Solapamiento con otro turno",
        shiftId: shift.id,
      });
    }

    // Weekly hours check
    const weeklyMinutes = this.getWeeklyHours(shift, existingShifts);
    if (weeklyMinutes + duration > LFT_LIMITS.WEEKLY_HOURS) {
      errors.push({
        type: "WEEKLY_HOURS",
        severity: "error",
        message: "Excedería límite semanal de 48 horas",
        shiftId: shift.id,
      });
    }

    // Rest period check
    const restViolation = this.checkRestPeriod(shift, existingShifts);
    if (restViolation) warnings.push(restViolation);

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateShifts(shifts: Shift[]): ValidationResult {
    const allErrors: LFTViolation[] = [];
    const allWarnings: LFTViolation[] = [];

    const byEmployee = this.groupByEmployee(shifts);

    for (const employeeShifts of Object.values(byEmployee)) {
      for (let i = 0; i < employeeShifts.length; i++) {
        const shift = employeeShifts[i];
        const others = employeeShifts.filter((_, idx) => idx !== i);
        const result = this.validateShift(shift, others);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      }

      // Consecutive days check
      const consecutiveErrors = this.checkConsecutiveDays(employeeShifts);
      allErrors.push(...consecutiveErrors);
    }

    return {
      isValid: allErrors.length === 0,
      errors: this.dedupe(allErrors),
      warnings: this.dedupe(allWarnings),
    };
  }

  private getDuration(start: string, end: string): number {
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;
    return endMins >= startMins ? endMins - startMins : 24 * 60 - startMins + endMins;
  }

  private checkOverlap(s1: Shift, s2: Shift): boolean {
    const t1Start = this.toMinutes(s1.startTime);
    const t1End = this.toMinutes(s1.endTime);
    const t2Start = this.toMinutes(s2.startTime);
    const t2End = this.toMinutes(s2.endTime);
    return t1Start < t2End && t1End > t2Start;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  private getWeeklyHours(shift: Shift, existing: Shift[]): number {
    const weekStart = startOfWeek(parseISO(shift.shiftDate), { weekStartsOn: 1 });
    return existing
      .filter((s) => {
        const sWeek = startOfWeek(parseISO(s.shiftDate), { weekStartsOn: 1 });
        return sWeek.getTime() === weekStart.getTime() && s.status !== "CANCELLED";
      })
      .reduce((sum, s) => sum + this.getDuration(s.startTime, s.endTime), 0);
  }

  private checkRestPeriod(shift: Shift, existing: Shift[]): LFTViolation | null {
    const shiftDate = parseISO(shift.shiftDate);
    const prevDayShifts = existing.filter((s) => {
      const sDate = parseISO(s.shiftDate);
      return differenceInDays(shiftDate, sDate) === 1 && s.status !== "CANCELLED";
    });

    for (const prev of prevDayShifts) {
      const prevEnd = this.toMinutes(prev.endTime);
      const currStart = this.toMinutes(shift.startTime);
      const rest = prevEnd > currStart ? 24 * 60 - prevEnd + currStart : currStart - prevEnd;

      if (rest < LFT_LIMITS.REST_BETWEEN_SHIFTS) {
        return {
          type: "REST_PERIOD",
          severity: "warning",
          message: `Descanso menor a 8 horas (${Math.floor(rest / 60)}h)`,
          shiftId: shift.id,
        };
      }
    }
    return null;
  }

  private checkConsecutiveDays(shifts: Shift[]): LFTViolation[] {
    const errors: LFTViolation[] = [];
    const sorted = shifts
      .filter((s) => s.status !== "CANCELLED")
      .sort((a, b) => new Date(a.shiftDate).getTime() - new Date(b.shiftDate).getTime());

    let consecutiveCount = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = parseISO(sorted[i - 1].shiftDate);
      const curr = parseISO(sorted[i].shiftDate);
      if (differenceInDays(curr, prev) === 1) {
        consecutiveCount++;
        if (consecutiveCount > LFT_LIMITS.MAX_CONSECUTIVE_DAYS) {
          errors.push({
            type: "DAILY_HOURS",
            severity: "error",
            message: "Más de 6 días consecutivos de trabajo",
            shiftId: sorted[i].id,
          });
        }
      } else {
        consecutiveCount = 1;
      }
    }
    return errors;
  }

  private groupByEmployee(shifts: Shift[]): Record<string, Shift[]> {
    return shifts.reduce((acc, s) => {
      acc[s.userId] = acc[s.userId] || [];
      acc[s.userId].push(s);
      return acc;
    }, {} as Record<string, Shift[]>);
  }

  private dedupe(violations: LFTViolation[]): LFTViolation[] {
    const seen = new Set<string>();
    return violations.filter((v) => {
      const key = `${v.type}-${v.shiftId}-${v.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const shiftValidationService = new ShiftValidationService();
