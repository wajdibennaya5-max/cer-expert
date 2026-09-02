"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
        router.refresh();
      }}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-red-500/12 hover:text-red-300"
    >
      <Icon name="logout" size={17} />
      Se déconnecter
    </button>
  );
}
