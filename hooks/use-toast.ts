"use client";

import { toast as sonnerToast, Toaster, type ExternalToast } from "sonner";

type ToastOptions = {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
};

function toast(options: ToastOptions | string) {
    if (typeof options === "string") {
        sonnerToast(options);
    } else if (options.variant === "destructive") {
        sonnerToast.error(options.description || options.title);
    } else {
        sonnerToast(options.title || options.description);
    }
}

function useToast() {
    return { toast };
}

export { useToast, Toaster, toast };
export { useSonner } from "sonner";