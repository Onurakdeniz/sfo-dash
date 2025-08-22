import { toast as sonnerToast } from "sonner";

type Toast = {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  action?: React.ReactNode;
};

// Re-export sonner toast with useToast hook pattern for compatibility
export function useToast() {
  const toast = ({ title, description, variant, action }: Toast) => {
    switch (variant) {
      case 'destructive':
        sonnerToast.error(title, { description, action });
        break;
      case 'success':
        sonnerToast.success(title, { description, action });
        break;
      case 'warning':
        sonnerToast.warning(title, { description, action });
        break;
      case 'info':
        sonnerToast.info(title, { description, action });
        break;
      default:
        sonnerToast(title, { description, action });
    }
  };

  return {
    toast,
  };
}

// Also export toast directly for convenience
export { toast } from "sonner";