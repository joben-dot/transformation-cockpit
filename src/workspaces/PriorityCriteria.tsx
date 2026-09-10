import type { SteeringProfileVersion } from "../domain";
export function PriorityCriteria({profile}:{profile:SteeringProfileVersion}) {
  return <details className="priority-criteria"><summary>Prioriteringskriterier och vikter · {profile.profileName} v{profile.versionNumber}</summary><p>{profile.demoAssumption} Bedömningen stödjer ett mänskligt ställningstagande. Den bestämmer inte körordning eller start.</p><div className="table-scroll"><table><thead><tr><th>Kriterium</th><th>Vikt</th><th>Bedömningsgrund</th></tr></thead><tbody>{profile.criteria.map(c=><tr key={c.code}><th>{c.name}</th><td>{profile.weights[c.code]}%</td><td>{c.description}</td></tr>)}</tbody></table></div><p>Varje kriterium bedöms 0–100 med angivet underlag. Ändrade antaganden kan kräva en ny bedömning.</p></details>;
}
