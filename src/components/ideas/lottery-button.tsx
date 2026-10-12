"use client";

import { useState } from "react";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LotteryButton({
  onPick,
  disabled,
}: {
  onPick: () => string | null;
  disabled?: boolean;
}) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    if (spinning || disabled) return;
    setSpinning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 900));
    const id = onPick();
    setResult(id);
    setSpinning(false);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        disabled={disabled || spinning}
        onClick={handleClick}
        className={cn(
          "h-12 w-full gap-2 rounded-2xl bg-[var(--brand-ink)] text-[var(--brand-foam)] hover:bg-[var(--brand-ink)]/90",
          spinning && "animate-shake",
        )}
      >
        <Dices className={cn("size-5", spinning && "animate-spin")} />
        {spinning ? "Sorteando…" : "Que decida el azar"}
      </Button>
      {result && !spinning ? (
        <p className="animate-rise text-center text-sm text-[var(--brand-mute)]">
          Listo: hay un plan elegido. Mirá el destacadito.
        </p>
      ) : null}
    </div>
  );
}
