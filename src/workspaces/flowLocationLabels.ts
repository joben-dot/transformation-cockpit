import type { FlowStepKey } from "../application/selectors/flowSelectors";

export const flowLocationLabels: Record<FlowStepKey | "history", string> = {
  material: "Utmaning och businesscase", qualification: "Kvalificering",
  potential: "Bedömd effektpotential", priority: "Prioritering",
  conditions: "Förutsättningar och kostnad", commitments: "Lokala effektåtaganden",
  decision: "Start och beslut", measurement: "Förändring och mätning", history: "Beslutshistorik",
};
