import { useLayoutEffect, useRef, useState, type SetStateAction } from "react";
import type { ControlRoomContext } from "./ControlRoom";
import type { InitiativeId } from "../domain";
import type { FlowStepKey } from "../application/selectors/flowSelectors";
import type { CaseNavigationContext } from "./CaseWorkspace";

export interface WorkspaceRoute {
  workArea: "cases" | "effects" | "control" | "governance";
  showPortfolio: boolean;
  caseSection?: FlowStepKey;
  effectSection?: FlowStepKey | "history";
  portfolioSection: string;
  selectedInitiativeId: InitiativeId;
  caseContext: CaseNavigationContext;
  controlContext: ControlRoomContext;
}

// Search, filters and sort belong to the current list entry, not separate back steps.
function locationKey(r: WorkspaceRoute) {
  if (r.workArea === "cases") return r.showPortfolio
    ? `portfolio/${r.portfolioSection}/${r.selectedInitiativeId}`
    : `cases/${r.caseContext.activeId ?? "list"}/${r.caseSection ?? "flow"}`;
  if (r.workArea === "effects") return `effects/${r.selectedInitiativeId}/${r.effectSection ?? "flow"}`;
  return r.workArea === "control" ? `control/${r.controlContext.view}` : r.workArea;
}

export function useWorkspaceNavigation(initial: WorkspaceRoute) {
  const [route, setRoute] = useState(initial);
  const entries = useRef([{ route: initial, scroll: 0 }]);
  const position = useRef(0);
  const session = useRef(`workspace-${Date.now()}-${Math.random()}`);
  const restoring = useRef(false);
  const mounted = useRef(false);
  const [, refresh] = useState(0);
  const browserAvailable = typeof window !== "undefined" && !!window.history;

  const set = <K extends keyof WorkspaceRoute>(key: K, value: SetStateAction<WorkspaceRoute[K]>) => {
    if (browserAvailable) entries.current[position.current].scroll = window.scrollY;
    setRoute(previous => ({ ...previous, [key]: typeof value === "function"
      ? (value as (previous: WorkspaceRoute[K]) => WorkspaceRoute[K])(previous[key]) : value }));
  };

  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (browserAvailable) window.history.replaceState({ ...window.history.state, workspaceSession: session.current, workspacePosition: 0 }, "");
    } else if (restoring.current) {
      restoring.current = false;
      if (browserAvailable) window.scrollTo(0, entries.current[position.current].scroll);
    } else if (locationKey(entries.current[position.current].route) !== locationKey(route)) {
      entries.current = entries.current.slice(0, position.current + 1);
      entries.current.push({ route, scroll: 0 });
      position.current += 1;
      if (browserAvailable) {
        window.history.pushState({ workspaceSession: session.current, workspacePosition: position.current }, "");
        window.scrollTo(0, 0);
      }
      refresh(n => n + 1);
    } else entries.current[position.current].route = route;
  }, [route, browserAvailable]);

  useLayoutEffect(() => {
    if (!browserAvailable) return;
    const onPop = (event: PopStateEvent) => {
      const data = event.state;
      if (data?.workspaceSession !== session.current || !entries.current[data.workspacePosition]) return;
      entries.current[position.current].scroll = window.scrollY;
      position.current = data.workspacePosition;
      restoring.current = true;
      setRoute(entries.current[position.current].route);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [browserAvailable]);

  const back = () => {
    if (!position.current) return;
    if (browserAvailable) window.history.back();
    else {
      position.current -= 1;
      restoring.current = true;
      setRoute(entries.current[position.current].route);
    }
  };
  return { route, set, back, canGoBack: position.current > 0 };
}
