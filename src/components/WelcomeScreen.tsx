import { useMemo, useState } from "react";
import { Gamepad2, PlusCircle, FolderOpen } from "lucide-react";
import { listSaveSlots } from "../game/saves/saveSystem";
import { useCareerStore } from "../store/careerStore";
import { shortTime } from "../utils/format";

export function WelcomeScreen() {
  const goToSetup = useCareerStore((s) => s.goToSetup);
  const loadSave = useCareerStore((s) => s.loadSave);
  const [slots] = useState(() => listSaveSlots());

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-court shadow-lg">
            <Gamepad2 size={44} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Basketball Dynasty</h1>
            <p className="mt-1 text-base font-semibold text-white/50">Manager · Season Simulation</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid gap-3">
          <button
            className="flex items-center gap-3 rounded-xl bg-court px-6 py-4 text-left transition hover:bg-court/80"
            onClick={goToSetup}
          >
            <PlusCircle size={24} className="shrink-0 text-white" />
            <div>
              <div className="text-base font-black text-white">New Career</div>
              <div className="text-xs font-medium text-white/60">Create your coach and choose a team</div>
            </div>
          </button>

          {slots.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-1">
              <div className="px-3 pt-2 pb-1 text-[11px] font-black uppercase text-white/40">Continue</div>
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/10"
                  onClick={() => loadSave(slot.id)}
                >
                  <FolderOpen size={18} className="shrink-0 text-white/50" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-white">{slot.name}</div>
                    <div className="text-xs text-white/40">
                      Season {slot.seasonYear} · Saved {shortTime(slot.savedAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-white/25">Basketball Dynasty Manager v0.1</p>
      </div>
    </div>
  );
}
