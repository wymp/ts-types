import { Auth } from "./Auth";
import { PartialSelect } from "./Misc";

export namespace Audit {
  type uuid = string;

  /**
   *
   *
   *
   *
   * Data event definitions
   *
   *
   *
   *
   */

  declare interface BaseDataEvent {
    id: uuid;
    timestampMs: number;
    domain: string;
    clientId: string;
    userId: string | null;
    ip: string | null;
    action: "created" | "read" | "updated" | "deleted";
    targetType: string;
    targetId: uuid;
  }

  export type DataEvent<T> = ReadEvent | DeletedEvent | CreatedEvent | UpdatedEvent<T>;

  declare interface _DataEvent extends BaseDataEvent {
    meta?: unknown;
  }

  export interface ReadEvent extends _DataEvent {
    action: "read";
  }

  export interface DeletedEvent extends _DataEvent {
    action: "deleted";
  }

  export interface CreatedEvent extends _DataEvent {
    action: "created";
    rels?: {
      parents?: Array<[string, uuid]>; // type/id pairs representing entities that "own" the created object
      children?: Array<[string, uuid]>; // type/id pairs representing entities that are "owned by" the created object
    };
  }

  export interface UpdatedEvent<T> extends _DataEvent {
    action: "updated";
    changes: Changes<T>;
  }

  export type Changes<T> = {
    [F in keyof T]?: ChangeSpec<T, F>;
  };

  export type ChangeSpec<T, F extends keyof T = keyof T> =
    | AttributeChangeSpec<T, F>
    | RelationshipChangeSpec;

  export interface AttributeChangeSpec<T, K extends keyof T = keyof T> {
    t: "attr";
    prev: T[K] | null;
    next: T[K] | null;
  }

  export interface RelationshipChangeSpec {
    t: "rel";
    action: "added" | "changed" | "deleted";
    relType: string;
    relId: string | null;
  }

  /**
   * The auditor client has methods named for the possible actions, so we can omit the "action"
   * key from submitted events. Additionally, it will add timestamp, domain, and id for us, so
   * we can make those optional.
   */
  export declare type SubmittedEvent<T extends _DataEvent = _DataEvent> = Omit<
    PartialSelect<T, "id" | "timestampMs" | "domain">,
    "action" | "clientId" | "userId" | "ip"
  > & { auth: Auth.ReqInfo };

  /**
   * The interface that any auditor client must implement
   */
  export interface ClientInterface {
    create(ev: SubmittedEvent<CreatedEvent>): Promise<void>;
    read(ev: SubmittedEvent): Promise<void>;
    update<T>(ev: SubmittedEvent<UpdatedEvent<T>>): Promise<void>;
    delete(ev: SubmittedEvent): Promise<void>;
    diff<T>(
      prev: T | null | undefined,
      next: Partial<T>,
      // A map of relationship keys to the "type" that they should be declared as
      rels: { [k in keyof T]?: string }
    ): Changes<T>;
  }
}
