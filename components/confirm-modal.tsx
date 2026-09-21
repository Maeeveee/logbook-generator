"use client";

import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "destructive",
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-5 text-card-foreground shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              variant === "destructive"
                ? "bg-destructive/15 text-destructive"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
          >
            {variant === "destructive" ? (
              <Trash2 className="size-5" />
            ) : (
              <AlertTriangle className="size-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold leading-tight text-foreground">
              {title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t pt-3.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="text-xs font-medium"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
