"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  publishShifts as publishShiftsAction,
  duplicateShifts as duplicateShiftsAction,
} from "@/app/actions/shifts";
import { Shift, ShiftFilters, CreateShiftInput } from "@/lib/types/shifts";

export interface UseShiftsReturn {
  shifts: Shift[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  createShift: (data: CreateShiftInput) => Promise<Shift>;
  updateShift: (id: string, data: Partial<CreateShiftInput>) => Promise<Shift>;
  deleteShift: (id: string) => Promise<void>;
  publishShifts: (shiftIds: string[]) => Promise<void>;
  duplicateShifts: (shiftIds: string[], targetWeekStart: Date) => Promise<Shift[]>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isPublishing: boolean;
  isDuplicating: boolean;
  refetch: () => Promise<void>;
}

export function useShifts(filters: ShiftFilters = {}): UseShiftsReturn {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const data = await getShifts(filters);
      setShifts(data);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleCreate = useCallback(
    async (data: CreateShiftInput): Promise<Shift> => {
      setIsCreating(true);
      try {
        const result = await createShift(data);
        await fetchShifts();
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    [fetchShifts]
  );

  const handleUpdate = useCallback(
    async (id: string, data: Partial<CreateShiftInput>): Promise<Shift> => {
      setIsUpdating(true);
      try {
        const result = await updateShift(id, data);
        await fetchShifts();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchShifts]
  );

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      setIsDeleting(true);
      try {
        await deleteShift(id);
        await fetchShifts();
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchShifts]
  );

  const handlePublish = useCallback(
    async (shiftIds: string[]): Promise<void> => {
      setIsPublishing(true);
      try {
        await publishShiftsAction(shiftIds);
        await fetchShifts();
      } finally {
        setIsPublishing(false);
      }
    },
    [fetchShifts]
  );

  const handleDuplicate = useCallback(
    async (shiftIds: string[], targetWeekStart: Date): Promise<Shift[]> => {
      setIsDuplicating(true);
      try {
        const result = await duplicateShiftsAction(shiftIds, targetWeekStart);
        await fetchShifts();
        return result;
      } finally {
        setIsDuplicating(false);
      }
    },
    [fetchShifts]
  );

  return {
    shifts,
    isLoading,
    isError,
    error,
    createShift: handleCreate,
    updateShift: handleUpdate,
    deleteShift: handleDelete,
    publishShifts: handlePublish,
    duplicateShifts: handleDuplicate,
    isCreating,
    isUpdating,
    isDeleting,
    isPublishing,
    isDuplicating,
    refetch: fetchShifts,
  };
}
