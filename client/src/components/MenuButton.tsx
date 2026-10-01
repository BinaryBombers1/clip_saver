import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export type MenuItem = {
  label: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  muted?: boolean;
};

export default function MenuButton({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative md:hidden">
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative z-50 grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-[#0b0e14] text-lg text-slate-200 transition active:scale-95"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-white/10 bg-[#0b0e14] p-2 shadow-2xl animate-rise">
            {items.map((it) => {
              const cls = `block rounded-lg px-3.5 py-3 text-sm transition ${
                it.danger
                  ? "text-bad hover:bg-bad/10"
                  : it.muted
                    ? "text-slate-500"
                    : "text-slate-200 hover:bg-white/5"
              }`;
              if (it.muted) {
                return (
                  <div key={it.label} className="truncate px-3.5 py-2 text-xs text-slate-600">
                    {it.label}
                  </div>
                );
              }
              if (it.to) {
                return (
                  <Link key={it.label} to={it.to} className={cls} onClick={() => setOpen(false)}>
                    {it.label}
                  </Link>
                );
              }
              if (it.href) {
                return (
                  <a
                    key={it.label}
                    href={it.href}
                    className={cls}
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </a>
                );
              }
              return (
                <button
                  key={it.label}
                  className={`${cls} w-full text-left`}
                  onClick={() => {
                    setOpen(false);
                    it.onClick?.();
                  }}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
