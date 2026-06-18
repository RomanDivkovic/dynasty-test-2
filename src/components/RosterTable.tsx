import { getRoster } from "../game/data/selectors";
import { useCareerStore } from "../store/careerStore";

export function RosterTable() {
  const players = useCareerStore((state) => state.players);
  const selectedTeamId = useCareerStore((state) => state.selectedTeamId);
  const roster = getRoster(players, selectedTeamId);

  return (
    <div className="overflow-hidden rounded border border-black/10">
      <table className="w-full text-sm">
        <thead className="bg-chalk text-left text-[11px] uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2">Pos</th>
            <th className="px-3 py-2 text-right">Age</th>
            <th className="px-3 py-2 text-right">OVR</th>
            <th className="px-3 py-2 text-right">3PT</th>
            <th className="px-3 py-2 text-right">IQ</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((player) => (
            <tr key={player.id} className="border-t border-black/10">
              <td className="px-3 py-2">
                <div className="font-black">{player.name}</div>
                <div className="text-xs text-slate-500">
                  {player.height}, {player.weight} lbs
                </div>
              </td>
              <td className="px-3 py-2 font-bold">{player.position}</td>
              <td className="px-3 py-2 text-right">{player.age}</td>
              <td className="px-3 py-2 text-right font-black">{player.overall}</td>
              <td className="px-3 py-2 text-right">{player.attributes.threePoint}</td>
              <td className="px-3 py-2 text-right">{player.attributes.basketballIq}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
