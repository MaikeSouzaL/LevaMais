"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger",
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: "text-red-600",
      bg: "bg-red-50",
      button: "bg-red-600 hover:bg-red-700 disabled:bg-red-400",
    },
    warning: {
      icon: "text-amber-600",
      bg: "bg-amber-50",
      button: "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400",
    },
    info: {
      icon: "text-blue-600",
      bg: "bg-blue-50",
      button: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400",
    },
  };

  const style = colors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-full", style.bg)}>
              <AlertTriangle className={cn("w-6 h-6", style.icon)} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600 mt-1">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-6 py-2 text-white rounded-lg transition-colors font-medium shadow-sm",
              style.button
            )}
          >
            {loading ? "Processando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook para usar confirm dialog
export function useConfirmDialog() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [loading, setLoading] = React.useState(false);

  const showConfirm = React.useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void | Promise<void>,
      type: "danger" | "warning" | "info" = "danger"
    ) => {
      setDialog({
        isOpen: true,
        title,
        message,
        onConfirm: async () => {
          setLoading(true);
          try {
            await onConfirm();
          } finally {
            setLoading(false);
            setDialog((prev) => ({ ...prev, isOpen: false }));
          }
        },
        type,
      });
    },
    []
  );

  const closeDialog = React.useCallback(() => {
    if (!loading) {
      setDialog((prev) => ({ ...prev, isOpen: false }));
    }
  }, [loading]);

  const ConfirmDialogComponent = React.useMemo(
    () => (
      <ConfirmDialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        loading={loading}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    ),
    [dialog, closeDialog, loading]
  );

  return { showConfirm, ConfirmDialogComponent };
}
