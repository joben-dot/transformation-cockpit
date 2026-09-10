import type { FlowStepKey } from "../application/selectors/flowSelectors";

export const flowLocationLabels: Record<FlowStepKey | "history", string> = {
  material: "Utmaning", businesscase: "Businesscase", qualification: "Kvalificering",
  potential: "Bedömd effektpotential", priority: "Prioritering",
  conditions: "Förutsättningar och körordning", commitments: "Lokala effektåtaganden",
  decision: "Startbeslut", implementation: "Genomförande och förändring", measurement: "Effektuppföljning", learning: "Avslut, lärande och skalning", history: "Beslutshistorik",
};
