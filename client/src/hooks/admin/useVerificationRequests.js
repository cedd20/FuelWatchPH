import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "@/services/adminApi";

export function useVerificationRequests(status) {
  return useQuery({
    queryKey: ["admin-verification-requests", status || "all"],
    queryFn: () => adminApi.listVerificationRequests({ status }),
    staleTime: 15_000,
  });
}

export function useVerificationRequest(requestId) {
  return useQuery({
    queryKey: ["admin-verification-request", requestId],
    queryFn: () => adminApi.getVerificationRequest(requestId),
    enabled: Boolean(requestId),
  });
}

function useVerificationMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (_data, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-log"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verification-request", requestId] });
    },
  });
}

export function useApproveVerificationRequest() {
  return useVerificationMutation(({ requestId, adminNotes }) =>
    adminApi.approveVerificationRequest(requestId, adminNotes),
  );
}

export function useRejectVerificationRequest() {
  return useVerificationMutation(({ requestId, adminNotes }) =>
    adminApi.rejectVerificationRequest(requestId, adminNotes),
  );
}

export function useRequestVerificationCorrection() {
  return useVerificationMutation(({ requestId, adminNotes }) =>
    adminApi.requestVerificationCorrection(requestId, adminNotes),
  );
}

export function useUpdateVerificationRequestNotes() {
  return useVerificationMutation(({ requestId, adminNotes }) =>
    adminApi.updateVerificationRequestNotes(requestId, adminNotes),
  );
}
