"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyReports,
  type ReportsQuery,
  type Report,
} from "@/lib/reports-api";

export function useMyReports(query: ReportsQuery = {}) {
  return useQuery({
    queryKey: ["my-reports", query],
    queryFn: () => getMyReports(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useInvalidateMyReports() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["my-reports"] });
  };
}

export function usePrefetchMyReports() {
  const queryClient = useQueryClient();

  return (query: ReportsQuery = {}) => {
    queryClient.prefetchQuery({
      queryKey: ["my-reports", query],
      queryFn: () => getMyReports(query),
      staleTime: 5 * 60 * 1000,
    });
  };
}
