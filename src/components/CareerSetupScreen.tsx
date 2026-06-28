import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useCareerStore } from "../store/careerStore";
import type { CoachBackground, CoachingStyle } from "../game/types/domain";

const BACKGROUNDS: { value: CoachBackground; label: string; desc: string }[] = [
  { value: "Former pro player", label: "Former Pro Player", desc: "Played in the league. Players respect you instantly." },
  { value: "Former college player", label: "Former College Player", desc: "College career. Solid fundamentals, developmental edge." },
  { value: "Former college coach", label: "College Coach", desc: "Coached at the college level. Expert tactician and recruiter." },
];

const STYLES: { value: CoachingStyle; label: string }[] = [
  { value: "Balanced", label: "Balanced" },
  { value: "Offensive", label: "Offensive" },
  { value: "Defensive", label: "Defensive" },
  { value: "Development", label: "Development" },
  { value: "Pace and Space", label: "Pace and Space" },
];

export function CareerSetupScreen() {
  const teams = useCareerStore((s) => s.teams);
  const goToMain = useCareerStore((s) => s.goToMain);

  const [step, setStep] = useState<1 | 2>(1);
  const [coachName, setCoachName] = useState("");
  const [background, setBackground] = useState<CoachBackground>("Former college coach");
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>("Balanced");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");

  const handleStart = () => {
    goToMain(teamId, coachName.trim() || "Rookie Coach", background, coachingStyle);
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-lg font-black">New Career</h1>
          <div className="flex gap-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className={`h-2 w-8 rounded-full transition-colors ${n <= step ? "bg-court" : "bg-white/20"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {step === 1 && (
            <div className="grid gap-8">
              <div>
                <h2 className="text-2xl font-black">Your Coach</h2>
                <p className="mt-1 text-sm text-white/50">Set your identity before hitting the court.</p>
              </div>

              {/* Name */}
              <div className="grid gap-2">
                <label className="text-xs font-black uppercase text-white/40">Coach Name</label>
                <input
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-white/20 focus:border-court"
                  placeholder="Enter your name…"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                />
              </div>

              {/* Background */}
              <div className="grid gap-2">
                <label className="text-xs font-black uppercase text-white/40">Former Occupation</label>
                <div className="grid gap-2">
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.value}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                        background === bg.value
                          ? "border-court bg-court/10"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                      onClick={() => setBackground(bg.value)}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          background === bg.value ? "border-court bg-court" : "border-white/30"
                        }`}
                      >
                        {background === bg.value && <Check size={11} className="text-white" />}
                      </div>
                      <div>
                        <div className="font-black text-white">{bg.label}</div>
                        <div className="text-xs text-white/50">{bg.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coaching style */}
              <div className="grid gap-2">
                <label className="text-xs font-black uppercase text-white/40">Coaching Style</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      className={`rounded-lg border px-4 py-2 text-sm font-black transition ${
                        coachingStyle === s.value
                          ? "border-court bg-court text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                      }`}
                      onClick={() => setCoachingStyle(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="flex items-center justify-center gap-2 rounded-xl bg-court px-6 py-4 text-base font-black transition hover:bg-court/80"
                onClick={() => setStep(2)}
              >
                Next: Choose Team
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-8">
              <div className="flex items-center gap-4">
                <button
                  className="flex items-center gap-1 text-sm font-bold text-white/50 hover:text-white"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <div>
                  <h2 className="text-2xl font-black">Choose Your Team</h2>
                  <p className="mt-0.5 text-sm text-white/50">You'll coach this franchise for your entire career.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    className={`relative rounded-xl border p-3 text-left transition ${
                      teamId === team.id
                        ? "border-court bg-court/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                    onClick={() => setTeamId(team.id)}
                  >
                    <div
                      className="mb-2 h-1.5 w-8 rounded-full"
                      style={{ backgroundColor: team.primaryColor }}
                    />
                    <div className="text-xs font-black text-white">{team.city}</div>
                    <div className="text-[11px] text-white/50">{team.name}</div>
                    {teamId === team.id && (
                      <div className="absolute right-2 top-2">
                        <Check size={14} className="text-court" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                className="flex items-center justify-center gap-2 rounded-xl bg-court px-6 py-4 text-base font-black transition hover:bg-court/80"
                onClick={handleStart}
                disabled={!teamId}
              >
                Start Career
                <Check size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
