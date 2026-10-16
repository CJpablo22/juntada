"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressMemoryPhoto } from "@/lib/memory-photo";

type Props = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
};

/** Optional photo picker with client-side compression preview. */
export function MemoryPhotoField({
  value,
  onChange,
  label = "Foto del recuerdo (opcional)",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const result = await compressMemoryPhoto(file);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.dataUrl);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="relative overflow-hidden border border-[var(--line)] bg-[var(--wash)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Vista previa del recuerdo"
            className="max-h-56 w-full object-cover"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-2 top-2 bg-[var(--mesa-foam)]"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <X className="size-4" />
            Quitar
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 border border-dashed border-[var(--ink)] bg-[var(--mesa-foam)] px-3 py-6 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--wash)] disabled:opacity-50"
        >
          <ImagePlus className="size-4" />
          {busy ? "Comprimiendo…" : "Elegir foto"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <p className="text-xs text-[var(--mute)]">
        Se comprime en el móvil; no hace falta subir a un servicio de pago.
      </p>
      {error ? <p className="text-sm text-[#7f1d1d]">{error}</p> : null}
    </div>
  );
}
