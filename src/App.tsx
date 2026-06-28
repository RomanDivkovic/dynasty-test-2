import {
  BarChart3,
  Gamepad2,
  Search,
  ArrowLeftRight,
  Users,
  Save,
} from "lucide-react";
import { CareerSetupScreen } from "./components/CareerSetupScreen";
import { GameCenter } from "./components/GameCenter";
import { LeagueOverview } from "./components/LeagueOverview";
import { MyRoster } from "./components/MyRoster";
import { Panel } from "./components/Panel";
import { ScoutingView } from "./components/ScoutingView";
import { TacticsPanel } from "./components/TacticsPanel";
import { TradeCenter } from "./components/TradeCenter";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { formatTeam, getTeam } from "./game/data/selectors";
import { useCareerStore } from "./store/careerStore";
import type { MainTab } from "./store/careerStore";
import { shortTime } from "./utils/format";

export default function App() {
  const screen = useCareerStore((s) => s.screen);

  if (screen === "welcome") return <WelcomeScreen />;
  if (screen === "setup") return <CareerSetupScreen />;
  return <MainGame />;
}

const TABS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
  { id: "game", label: "Game", icon: <Gamepad2 size={16} /> },
  { id: "roster", label: "Roster", icon: <Users size={16} /> },
  { id: "scout", label: "Scout", icon: <Search size={16} /> },
  { id: "trades", label: "Trades", icon: <ArrowLeftRight size={16} /> },
  { id: "league", label: "League", icon: <BarChart3 size={16} /> },
];

function MainGame() {
  const teams = useCareerStore((s) => s.teams);
  const selectedTeamId = useCareerStore((s) => s.selectedTeamId);
  const coach = useCareerStore((s) => s.coach);
  const activeTab = useCareerStore((s) => s.activeTab);
  const setActiveTab = useCareerStore((s) => s.setActiveTab);
  const manualSave = useCareerStore((s) => s.manualSave);
  const lastSavedAt = useCareerStore((s) => s.lastSavedAt);
  const season = useCareerStore((s) => s.season);

  const selectedTeam = getTeam(teams, selectedTeamId);
  const record = season.records[selectedTeamId] ?? { wins: 0, losses: 0 };

  return (
    <div className="min-h-screen bg-chalk text-ink">
      {/* Top header */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: selectedTeam.primaryColor }}
            >
              <Gamepad2 size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight">Basketball Dynasty</h1>
              <p className="text-xs font-semibold text-slate-500">
                {coach.name} · {formatTeam(selectedTeam)} · Season {coach.seasonsCompleted + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-4 sm:flex">
              <Stat label="Record" value={`${record.wins}–${record.losses}`} />
              <Stat label="Conf" value={selectedTeam.conference} />
              <Stat label="Style" value={coach.coachingStyle} />
            </div>
            <button
              className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-pine"
              onClick={manualSave}
              title={lastSavedAt ? `Last saved ${shortTime(lastSavedAt)}` : "Save career"}
            >
              <Save size={14} />
              Save
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition ${
                activeTab === tab.id
                  ? "border-pine text-pine"
                  : "border-transparent text-slate-500 hover:text-ink"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-5">
        {activeTab === "game" && (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Panel title="Live Game">
              <GameCenter />
            </Panel>
            <Panel title="Tactics">
              <TacticsPanel />
            </Panel>
          </div>
        )}

        {activeTab === "roster" && (
          <Panel title="Roster Management">
            <MyRoster />
          </Panel>
        )}

        {activeTab === "scout" && (
          <Panel title="Scouting">
            <ScoutingView />
          </Panel>
        )}

        {activeTab === "trades" && (
          <Panel title="Trade Center">
            <TradeCenter />
          </Panel>
        )}

        {activeTab === "league" && (
          <Panel title="League Standings">
            <LeagueOverview />
          </Panel>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] font-black uppercase text-slate-400">{label}</div>
      <div className="text-sm font-black">{value}</div>
    </div>
  );
}
