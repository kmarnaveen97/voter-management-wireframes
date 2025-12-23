/**
 * Campaign Users React Query Hooks
 *
 * Hooks for managing campaign team users.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import * as usersApi from "@/lib/api/users";
import type {
  CampaignUser,
  UsersResponse,
  CreateUserResponse,
} from "@/lib/api/users";
import { toast } from "sonner";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Fetch all campaign users
 */
export function useCampaignUsers(
  options?: Partial<UseQueryOptions<UsersResponse>>
) {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => usersApi.getUsers(),
    staleTime: 5 * 60 * 1000, // Users don't change often
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Create a new campaign user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      username,
      displayName,
      role,
    }: {
      username: string;
      displayName?: string;
      role?: string;
    }) => usersApi.createUser(username, displayName, role),
    onSuccess: (data) => {
      toast.success("User created", {
        description: `${data.user.username} has been added to the team`,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
    },
    onError: (error) => {
      toast.error("Failed to create user", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}
