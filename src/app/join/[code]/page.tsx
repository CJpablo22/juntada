"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/providers/app-provider";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { ready, currentUser, joinGroupByCode } = useApp();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      router.replace(`/enter?next=/join/${params.code}`);
      return;
    }
    const id = joinGroupByCode(params.code);
    if (id) router.replace(`/app/group/${id}`);
    else router.replace("/app");
  }, [ready, currentUser, params.code, joinGroupByCode, router]);

  return (
    <div className="grid min-h-[100svh] place-items-center text-[var(--brand-mute)]">
      Uniéndote al grupo…
    </div>
  );
}
