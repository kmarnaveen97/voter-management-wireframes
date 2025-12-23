import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";

/**
 * Standardized toast notifications for consistent UX
 * Use these instead of calling sonner directly
 */

type ToastOptions = Omit<ExternalToast, "description">;

// Success toasts - for completed actions
export const showSuccess = (message: string, options?: ToastOptions) => {
  sonnerToast.success(message, {
    duration: 3000,
    ...options,
  });
};

// Error toasts - for failed actions
export const showError = (message: string, options?: ToastOptions) => {
  sonnerToast.error(message, {
    duration: 5000, // Longer for errors
    ...options,
  });
};

// Warning toasts - for important notices
export const showWarning = (message: string, options?: ToastOptions) => {
  sonnerToast.warning(message, {
    duration: 4000,
    ...options,
  });
};

// Info toasts - for general information
export const showInfo = (message: string, options?: ToastOptions) => {
  sonnerToast.info(message, {
    duration: 3000,
    ...options,
  });
};

// Loading toast with promise - for async operations
export const showLoading = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) => {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};

// Specific action toasts for common operations
export const toast = {
  // Voter operations
  voterTagged: (sentiment: string, count: number = 1) => {
    const message =
      count > 1
        ? `${count} voters marked as ${sentiment}`
        : `Marked as ${sentiment}`;
    showSuccess(message);
  },

  voterTagError: () => {
    showError("Failed to update voter sentiment. Please try again.");
  },

  // Bulk operations
  bulkSuccess: (action: string, count: number) => {
    showSuccess(`${action} ${count} ${count === 1 ? "item" : "items"}`);
  },

  bulkError: (action: string) => {
    showError(`Failed to ${action}. Please try again.`);
  },

  // List operations
  listSwitched: (listId: number) => {
    showInfo(`Switched to List ${listId}`);
  },

  // Data operations
  copied: (item: string) => {
    showSuccess(`${item} copied to clipboard`);
  },

  saved: (item: string = "Changes") => {
    showSuccess(`${item} saved`);
  },

  deleted: (item: string) => {
    showSuccess(`${item} deleted`);
  },

  // Loading states
  loading: (message: string = "Loading...") => {
    return sonnerToast.loading(message);
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  // Network errors
  networkError: () => {
    showError("Network error. Please check your connection.");
  },

  // API errors with details
  apiError: (message?: string) => {
    showError(message || "Something went wrong. Please try again.");
  },

  // Confirmation with undo
  withUndo: (message: string, onUndo: () => void, duration: number = 5000) => {
    sonnerToast(message, {
      duration,
      action: {
        label: "Undo",
        onClick: onUndo,
      },
    });
  },

  // Feature not available
  notImplemented: (feature: string = "This feature") => {
    showInfo(`${feature} is coming soon!`);
  },

  // Offline warning
  offline: () => {
    showWarning("You're offline. Changes will sync when connected.");
  },
};

export default toast;
