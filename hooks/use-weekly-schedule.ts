"use client";

/**
 * useWeeklySchedule Hook
 * Manages weekly schedule navigation and state
 */

import { useState, useMemo, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  isSameWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { Shift } from "@/lib/types";

export interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  dateString: string;
}

export interface UseWeeklyScheduleReturn {
  currentWeek: Date;
  weekStart: Date;
  weekEnd: Date;
  weekDays: WeekDay[];
  weekLabel: string;
  isCurrentWeek: boolean;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  goToWeek: (date: Date) => void;
  getShiftsForDay: (shifts: Shift[], date: Date | string) => Shift[];
  getShiftsForWeek: (shifts: Shift[]) => Shift[];
}

export function useWeeklySchedule(initialWeek?: Date): UseWeeklyScheduleReturn {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const date = initialWeek || new Date();
    return startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  });

  const weekStart = useMemo(
    () => startOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek]
  );

  const weekEnd = useMemo(
    () => endOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek]
  );

  const weekDays = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return days.map((date) => ({
      date,
      dayName: format(date, "EEEE", { locale: es }),
      dayNumber: date.getDate(),
      dateString: format(date, "yyyy-MM-dd"),
    }));
  }, [weekStart, weekEnd]);

  const weekLabel = useMemo(() => {
    const start = format(weekStart, "d MMM", { locale: es });
    const end = format(weekEnd, "d MMM yyyy", { locale: es });
    return `${start} - ${end}`;
  }, [weekStart, weekEnd]);

  const isCurrentWeek = useMemo(() => {
    return isSameWeek(currentWeek, new Date(), { weekStartsOn: 1 });
  }, [currentWeek]);

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  const goToWeek = useCallback((date: Date) => {
    setCurrentWeek(startOfWeek(date, { weekStartsOn: 1 }));
  }, []);

  const getShiftsForDay = useCallback(
    (shifts: Shift[], date: Date | string): Shift[] => {
      const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
      return shifts.filter(
        (s) => s.shiftDate === dateStr && s.status !== "CANCELLED"
      );
    },
    []
  );

  const getShiftsForWeek = useCallback(
    (shifts: Shift[]): Shift[] => {
      const startStr = format(weekStart, "yyyy-MM-dd");
      const endStr = format(weekEnd, "yyyy-MM-dd");
      return shifts.filter(
        (s) =>
          s.shiftDate >= startStr &&
          s.shiftDate <= endStr &&
          s.status !== "CANCELLED"
      );
    },
    [weekStart, weekEnd]
  );

  return {
    currentWeek,
    weekStart,
    weekEnd,
    weekDays,
    weekLabel,
    isCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToWeek,
    getShiftsForDay,
    getShiftsForWeek,
  };
}
