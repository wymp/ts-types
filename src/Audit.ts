import { Auth } from "./Auth";
import { PartialSelect } from "./Misc";

/**
 * These are experimental types describing a data audit system. The idea is that you want to capture some basic
 * information about what changed, who changed it, from where, and when. In addition, it's often useful to capture
 * information about object hierarchies so that you can easily query for _trees_ of objects. For example, if I want to
 * see all data events pertaining to a task in a task-management system, I would want to see changes to the task itself
 * as well as changes to the task's comments, attachments, etc. These entities are considered "owned" by the task, and
 * when I run a query for all changes to a given task, I want to include those changes as well.
 * 
 * This module defines some basic types for data events as well as an interface for a data event client.
 * 
 * See [this very old but still perhaps useful POC](https://github.com/kael-shipman/audit-logging-poc) for a data audit
 * system. This does not use these types, but it could easily be adapted to use them. (I'll probably update that at
 * some point to use these types.)
 */
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
    meta?: unknown;
  }

  export type DataEvent<T> = ReadEvent | DeletedEvent | CreatedEvent | UpdatedEvent<T>;

  export interface ReadEvent extends BaseDataEvent {
    action: "read";
  }

  export interface DeletedEvent extends BaseDataEvent {
    action: "deleted";
  }

  export interface CreatedEvent extends BaseDataEvent {
    action: "created";
    rels?: {
      parents?: Array<[string, uuid]>; // type/id pairs representing entities that "own" the created object
      children?: Array<[string, uuid]>; // type/id pairs representing entities that are "owned by" the created object
    };
  }

  export interface UpdatedEvent<T> extends BaseDataEvent {
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
  export declare type SubmittedEvent<T extends BaseDataEvent = BaseDataEvent> = Omit<
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
