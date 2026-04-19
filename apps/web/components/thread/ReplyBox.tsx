'use client';

import { useState } from 'react';

export type ReplyPhoto = { name: string; size: number };

export type ReplyBoxProps = {
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  maxPhotos?: number;
  /** Controlled text value; omit for uncontrolled use. */
  value?: string;
  onChange?: (value: string) => void;
  /** Controlled photo list; omit for uncontrolled use. */
  photos?: ReplyPhoto[];
  onPhotosChange?: (photos: ReplyPhoto[]) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  helperText?: string;
};

/**
 * Composer for any thread: textarea + optional photo drop-zone + submit
 * button. Shared by the AV Care claim submission (A51), AV Care claim
 * detail (A52), and the support widget (A24). Supports both controlled
 * (value/onChange) and uncontrolled use.
 */
export function ReplyBox({
  label,
  placeholder,
  submitLabel = 'Send',
  maxPhotos = 5,
  value,
  onChange,
  photos,
  onPhotosChange,
  onSubmit,
  disabled = false,
  helperText,
}: ReplyBoxProps) {
  const [dragOver, setDragOver] = useState(false);
  const [internalText, setInternalText] = useState('');
  const [internalPhotos, setInternalPhotos] = useState<ReplyPhoto[]>([]);

  const text = value !== undefined ? value : internalText;
  const setText = onChange ?? setInternalText;
  const photoList = photos !== undefined ? photos : internalPhotos;
  const setPhotoList = onPhotosChange ?? setInternalPhotos;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const space = maxPhotos - photoList.length;
    if (space <= 0) return;
    const next = Array.from(files)
      .slice(0, space)
      .map((f) => ({ name: f.name, size: f.size }));
    setPhotoList([...photoList, ...next]);
  }

  function removePhoto(i: number) {
    setPhotoList(photoList.filter((_, idx) => idx !== i));
  }

  return (
    <div
      className="border border-ink-10 bg-paper"
      style={{ padding: 24 }}
    >
      {label && (
        <div style={{ marginBottom: 14 }}>
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — {label}
          </span>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full resize-y bg-transparent"
        style={{
          border: 'none',
          outline: 'none',
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--ink)',
          padding: 0,
          minHeight: 120,
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{ marginTop: 20, borderTop: '1px solid var(--ink-10)', paddingTop: 20 }}
      >
        {photoList.length === 0 ? (
          <label
            className="block cursor-pointer text-center"
            style={{
              padding: 24,
              border: `1px dashed ${dragOver ? 'var(--ink)' : 'var(--ink-10)'}`,
              background: dragOver ? 'rgba(23,20,15,0.02)' : 'transparent',
              transition: 'border-color 200ms, background 200ms',
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>
              Drop photos here or <span className="underline" style={{ color: 'var(--ink)' }}>browse</span>
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 6 }}
            >
              Up to {maxPhotos} · JPG or PNG
            </div>
          </label>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
          >
            {photoList.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="bav-canvas relative grid place-items-center"
                style={{ aspectRatio: '1 / 1' }}
              >
                <div
                  className="font-mono w-full overflow-hidden text-center"
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-60)',
                    padding: 8,
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.name}
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="font-mono absolute"
                  style={{
                    top: 4,
                    right: 4,
                    background: 'rgba(23,20,15,0.85)',
                    color: 'var(--paper)',
                    border: 'none',
                    width: 22,
                    height: 22,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {photoList.length < maxPhotos && (
              <label
                className="grid cursor-pointer place-items-center"
                style={{
                  aspectRatio: '1 / 1',
                  border: '1px dashed var(--ink-10)',
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <span className="font-mono" style={{ fontSize: 20, color: 'var(--ink-30)' }}>
                  +
                </span>
              </label>
            )}
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-4"
        style={{ marginTop: 24 }}
      >
        {helperText ? (
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-30)' }}>
            {helperText}
          </span>
        ) : (
          <span />
        )}
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className="bav-cta ml-auto"
            style={{
              width: 'auto',
              padding: '16px 28px',
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default ReplyBox;
