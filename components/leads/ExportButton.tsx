"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "new" | "all";
};

/** CSV-Export-Link im Button-Stil (Close CRM). */
export function ExportButton({ href, children, variant = "all" }: Props) {
  return (
    <a
      href={href}
      className={cn(
        buttonVariants({ variant: variant === "new" ? "default" : "secondary" }),
        variant === "new"
          ? "rounded-[12px] bg-[#22c55e] text-black hover:bg-[#16a34a]"
          : "rounded-[12px] bg-[#3b82f6] text-white hover:bg-[#2563eb]"
      )}
    >
      {children}
    </a>
  );
}
