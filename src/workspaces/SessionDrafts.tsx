import { createContext, useContext, useRef, useState, type ReactNode, type SetStateAction } from "react";

const DraftContext = createContext<Map<string, unknown> | undefined>(undefined);
export function SessionDrafts({ children }: { children: ReactNode }) {
  const drafts = useRef(new Map<string, unknown>());
  return <DraftContext.Provider value={drafts.current}>{children}</DraftContext.Provider>;
}

/** Retain unfinished typing while moving between views. Never writes domain data or decisions. */
// The provider and its small draft hook intentionally share one context.
// eslint-disable-next-line react-refresh/only-export-components
export function useSessionDraft<T>(key: string, initial: T | (() => T)) {
  const drafts = useContext(DraftContext);
  const [value, setValue] = useState<T>(() => drafts?.has(key) ? drafts.get(key) as T
    : typeof initial === "function" ? (initial as () => T)() : initial);
  const current = useRef(value);
  current.current = value;
  const setDraft = (next: SetStateAction<T>) => {
    const result = typeof next === "function" ? (next as (previous: T) => T)(current.current) : next;
    current.current = result;
    drafts?.set(key, result);
    setValue(result);
  };
  return [value, setDraft] as const;
}
