"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/client/logout", { method: "POST" });
        router.refresh();
      }}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/12"
    >
      <Icon name="logout" size={16} />
      {label}
    </button>
  );
}
