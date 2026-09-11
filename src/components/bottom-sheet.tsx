"use client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function BottomSheet({
  open,
  onClose,
  children,
  onReturnFocus,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onReturnFocus?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        onCloseAutoFocus={
          onReturnFocus
            ? (e) => {
                e.preventDefault();
                onReturnFocus();
              }
            : undefined
        }
      >
        <DialogTitle>Item details</DialogTitle>
        <DialogDescription className="sr-only">
          View and manage this wishlist item.
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
