import type { DemoState } from "./demoState";

export type CommandErrorCode =
  | "ACTOR_NOT_FOUND"
  | "TARGET_NOT_FOUND"
  | "TARGET_ALREADY_EXISTS"
  | "INVALID_REFERENCE"
  | "INVALID_PAYLOAD"
  | "POST_STATE_INVALID";
export interface CommandError {
  code: CommandErrorCode;
  description: string;
  entityId?: string;
}
export type CommandResult =
  | { success: true; nextState: DemoState; affectedEntityIds: string[] }
  | {
      success: false;
      nextState: DemoState;
      errors: CommandError[];
      affectedEntityIds: [];
    };
