"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Modal } from "@/components/ui";
import { AVATAR_SIZE, compressAvatar } from "@/lib/avatar-image";
import { CONTENT as C } from "@/config/content.vi";

export function AvatarCrop({
  file,
  onClose,
  onDone,
}: {
  file: File;
  onClose: () => void;
  onDone: (image: Blob) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const alive = useRef(true);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [zoom, setZoom] = useState(1),
    [x, setX] = useState(50),
    [y, setY] = useState(50);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    alive.current = true;
    let active = true;
    let image: ImageBitmap | null = null;
    const source = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    source.src = objectUrl;
    // Decode large originals locally; only a bounded working image is retained.
    source
      .decode()
      .then(async () => {
        if (!active) return;
        const scale = Math.min(
          1,
          1024 / Math.max(source.naturalWidth, source.naturalHeight),
        );
        const value = await createImageBitmap(source, {
          resizeWidth: Math.max(1, Math.round(source.naturalWidth * scale)),
          resizeHeight: Math.max(1, Math.round(source.naturalHeight * scale)),
          resizeQuality: "high",
        });
        image = value;
        if (active) setBitmap(value);
        else value.close();
      })
      .catch(() => {
        if (active) setError(C.profile.imageError);
      })
      .finally(() => {
        URL.revokeObjectURL(objectUrl);
        source.src = "";
      });
    return () => {
      active = false;
      alive.current = false;
      image?.close();
      URL.revokeObjectURL(objectUrl);
      source.src = "";
    };
  }, [file]);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!bitmap || !ctx) return;
    const side = Math.min(bitmap.width, bitmap.height) / zoom;
    ctx.clearRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
    ctx.drawImage(
      bitmap,
      ((bitmap.width - side) * x) / 100,
      ((bitmap.height - side) * y) / 100,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    );
  }, [bitmap, zoom, x, y]);
  return (
    <Modal title={C.profile.crop} onClose={onClose}>
      <div className="avatar-crop">
        <canvas
          ref={canvas}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          role="img"
          aria-label={C.profile.preview}
        />
        <Field label={C.profile.zoom}>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </Field>
        <Field label={C.profile.horizontal}>
          <input
            type="range"
            min="0"
            max="100"
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
          />
        </Field>
        <Field label={C.profile.vertical}>
          <input
            type="range"
            min="0"
            max="100"
            value={y}
            onChange={(e) => setY(Number(e.target.value))}
          />
        </Field>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <div className="row">
          <Button secondary onClick={onClose} disabled={busy}>
            {C.common.cancel}
          </Button>
          <Button
            disabled={!bitmap || busy}
            onClick={async () => {
              if (!canvas.current) return;
              setBusy(true);
              try {
                const result = await compressAvatar(canvas.current);
                if (alive.current) onDone(result);
              } catch {
                setError(C.profile.imageError);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? C.common.loading : C.profile.useImage}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
