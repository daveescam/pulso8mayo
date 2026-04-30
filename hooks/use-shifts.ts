"use client";

/**
 * useShifts Hook
 * Manages shift data with TanStack Query for efficient caching and updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plannedShiftService } from "@/lib/services";
import { Shift, ShiftFilters, CreateShiftInput } from "@/lib/types";

const SHIFTS_QUERY_KEY = "shifts";

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
  refetch: () => Promise<unknown>;
}

export function useShifts(filters: ShiftFilters = {}): UseShiftsReturn {
  const queryClient = useQueryClient();

  // Query for fetching shifts
  const shiftsQuery = useQuery({
    queryKey: [SHIFTS_QUERY_KEY, filters],
    queryFn: () => plannedShiftService.getPlannedShifts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateShiftInput) => plannedShiftService.createPlannedShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_QUERY_KEY] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateShiftInput> }) =>
      plannedShiftService.updatePlannedShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_QUERY_KEY] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => plannedShiftService.deletePlannedShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_QUERY_KEY] });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (shiftIds: string[]) => plannedShiftService.publishShifts(shiftIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_QUERY_KEY] });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: ({ shiftIds, targetWeekStart }: { shiftIds: string[]; targetWeekStart: Date }) =>
      plannedShiftService.duplicateShifts(shiftIds, { targetWeekStart }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIFTS_QUERY_KEY] });
    },
  });

  return {
    shifts: shiftsQuery.data || [],
    isLoading: shiftsQuery.isLoading,
    isError: shiftsQuery.isError,
    error: shiftsQuery.error as Error | null,
    createShift: createMutation.mutateAsync,
    updateShift: updateMutation.mutateAsync,
    deleteShift: deleteMutation.mutateAsync,
    publishShifts: publishMutation.mutateAsync,
    duplicateShifts: duplicateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPublishing: publishMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    refetch: shiftsQuery.refetch,
  };
}
