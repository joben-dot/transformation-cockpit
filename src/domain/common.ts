export type IsoDate = string;
export type IsoDateTime = string;
export type EntityMap<T extends { id: string }> = Record<T["id"], T>;
export type EffectKind = "MONEY" | "RELEASED_TIME" | "QUALITY" | "OTHER";
export type RecordStatus = "DRAFT" | "ACTIVE" | "RETIRED";
export type Period = { from: IsoDate; to: IsoDate };
