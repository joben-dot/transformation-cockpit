import { createDemoData } from "../demo-data/createDemoData";
import { validateDemoState } from "../demo-data/validateDemoData";
import type { DemoState } from "./demoState";

export function initializeDemoState(): DemoState {
  const state = createDemoData();
  const errors = validateDemoState(state);
  if (errors.length)
    throw new Error(
      `Ogiltig syntetisk grunddata: ${errors.map((error) => `${error.code}:${error.path}:${error.description}`).join(", ")}`,
    );
  return state;
}
