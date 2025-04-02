import { toast as sonnerToast } from "sonner";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "destructive";
};

let toasts: ToasterToast[] = [];

function addToast(toast: ToasterToast) {
  toasts = [toast, ...toasts].slice(0, TOAST_LIMIT);

  sonnerToast(toast.title, {
    id: toast.id,
    description: toast.description,
    action: toast.action && {
      label: toast.action.label,
      onClick: toast.action.onClick,
    },
  });
}

function dismiss(toastId?: string) {
  toasts = toasts.filter((toast) => toast.id !== toastId);
  sonnerToast.dismiss(toastId);
}

export function useToast() {
  return {
    toast: (props: Omit<ToasterToast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const toast = { ...props, id };
      addToast(toast);
      setTimeout(() => dismiss(toast.id), TOAST_REMOVE_DELAY);
      return toast;
    },
    dismiss: (toastId?: string) => dismiss(toastId),
    toasts,
  };
}