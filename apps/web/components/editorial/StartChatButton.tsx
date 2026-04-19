'use client';

export const SUPPORT_CHAT_OPEN_EVENT = 'birminghamav:support-chat:open';

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * StartChatButton
 * Dispatches a global event that the floating SupportWidget listens for. This
 * avoids coupling unrelated pages to the widget's open-state store (which
 * lives inside the widget itself) and keeps the button a tiny client island.
 */
export function StartChatButton({ children, className = 'bav-cta' }: Props) {
  const open = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(SUPPORT_CHAT_OPEN_EVENT));
  };

  return (
    <button className={className} onClick={open}>
      {children}
    </button>
  );
}

export default StartChatButton;
