import { toast as sonnerToast } from "sonner";

// Re-export sonner toast with useToast hook pattern for compatibility
export function useToast() {
  return {
    toast: sonnerToast,
  };
}

// Also export toast directly for convenience
export { toast } from "sonner";