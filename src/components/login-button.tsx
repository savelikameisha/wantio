"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
export function LoginButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full h-11"
      disabled={pending}
    >
      {pending ? "Opening Google…" : children}
    </Button>
  );
}
