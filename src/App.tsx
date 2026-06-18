import { BarChart3, ClipboardList, Dumbbell, Gamepad2 } from "lucide-react";
import { CoachSetup } from "./components/CoachSetup";
import { GameCenter } from "./components/GameCenter";
import { LeagueOverview } from "./components/LeagueOverview";
import { Panel } from "./components/Panel";
import { RosterTable } from "./components/RosterTable";
import { TacticsPanel } from "./components/TacticsPanel";
import { formatTeam, getTeam } from "./game/data/selectors";
import { useCareerStore } from "./store/careerStore";

export default function App() {
  const teams = useCareerStore((state) => state.teams);
  const selectedTeamId = useCareerStore((state) => state.selectedTeamId);
  const coach = useCareerStore((state) => state.coach);
  const selectedTeam = getTeam(teams, selectedTeamId);

  return (
    <main className="min-h-screen bg-chalk text-ink">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded bg-court text-white">
                <Gamepad2 size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-normal md:text-4xl">Basketball Dynasty Manager</h1>
                <p className="text-sm font-semibold text-slate-500">
                  {coach.name} · {formatTeam(selectedTeam)} · Career {coach.seasonsCompleted}/{coach.maxSeasons}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded border border-black/10 bg-chalk text-center">
            <HeaderStat label="Conf" value={selectedTeam.conference} />
            <HeaderStat label="Div" value={selectedTeam.division} />
            <HeaderStat label="Style" value={coach.coachingStyle} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[310px_1fr_360px]">
        <aside className="grid content-start gap-4">
          <Panel title="Career">
            <CoachSetup />
          </Panel>
          <Panel
            title="League"
            action={
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-slate-500">
                <BarChart3 size={15} />
                Data
              </span>
            }
          >
            <LeagueOverview />
          </Panel>
        </aside>

        <section className="grid content-start gap-4">
          <Panel
            title="Live Game"
            action={
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-slate-500">
                <ClipboardList size={15} />
                Possession Engine
              </span>
            }
          >
            <GameCenter />
          </Panel>
          <Panel title="Roster">
            <RosterTable />
          </Panel>
        </section>

        <aside className="grid content-start gap-4">
          <Panel
            title="Tactics"
            action={
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-slate-500">
                <Dumbbell size={15} />
                Live
              </span>
            }
          >
            <TacticsPanel />
          </Panel>
        </aside>
      </div>
    </main>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-20 border-r border-black/10 px-3 py-2 last:border-r-0">
      <div className="text-[10px] font-black uppercase text-slate-500">{label}</div>
      <div className="text-sm font-black">{value}</div>
    </div>
  );
}
