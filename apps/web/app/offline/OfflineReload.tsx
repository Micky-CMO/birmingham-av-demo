'use client';

/**
 * Small client button used on /offline. Split out so the rest of the page
 * can render as a server component with no JS payload.
 */
export function OfflineReload() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') window.location.reload();
      }}
      className="bav-cta !w-auto px-9 py-[18px] text-[13px]"
    >
      Try again — reload
    </button>
  );
}

export default OfflineReload;
