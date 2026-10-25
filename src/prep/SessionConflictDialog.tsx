import { useEffect, useRef } from "react";

export default function SessionConflictDialog({
  onResume,
  onReplace,
  onCancel,
}: {
  onResume: () => void;
  onReplace: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="prep-confirm-backdrop">
      <section
        ref={dialog}
        className="prep-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unfinished-title"
        aria-describedby="unfinished-description"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
          if (event.key !== "Tab") return;
          const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          );
          if (!buttons?.length) return;
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <h3 id="unfinished-title">You have an unfinished session.</h3>
        <p id="unfinished-description">
          Resume it, or replace its saved answers with this new session. Already
          recorded practice results stay in your progress.
        </p>
        <div>
          <button className="button secondary" onClick={onResume}>
            Resume previous
          </button>
          <button className="button primary" onClick={onReplace}>
            Replace session
          </button>
          <button className="text-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
