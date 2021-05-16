import { Api as ApiTypes } from "./Api";

export namespace Auth {
  /**
   * This structure represents the expected authn/z info attached to any request made against the
   * system. Keys are as follows:
   *
   * t = set system (see below)
   * c = clientId
   * a = authorized
   * r = client roles
   * ip = ip address from which the request originated
   * d = "debug mode" - This indicates that a valid debug key was passed and that debugging
   * features should be made available
   * u.id = user id
   * u.r = user roles
   * u.s = An optional array of scopes granted via oauth. If null or undefined, then this is a
   * direct user request and not an oauth request.
   *
   * Note that roles and scopes may be strings (e.g., "sysadmin", "employee", etc...) or numbers
   * representing bitwise values. You must specify which system you are using using the `t`
   * parameter, where 0 means Arrays of strings and 1 means bitwise numbers.
   */
  export type ReqInfoString = {
    t: 0;
    c: string;
    a: boolean;
    r: Array<string>;
    ip: string;
    d?: boolean;
    u?: {
      id: string;
      r: Array<string>;
      s?: Array<string> | null;
    };
  };
  export type ReqInfoBitwise = {
    t: 1;
    c: string;
    a: boolean;
    r: number;
    ip: string;
    d?: boolean;
    u?: null | {
      id: string;
      r: number;
      s?: number | null;
    };
  };
  export type ReqInfo = ReqInfoString | ReqInfoBitwise;
  export type AuthdReq<T> = T & { auth: ReqInfo };

  export type ApiAttributes = {
    domain: string;
    version: string;
    url: string;
  };

  export type OrganizationAttributes = {
    name: string;
    createdMs: number;
  };

  export type ClientAttributes<Roles extends string> = {
    name: string;
    reqsPerSec: number;
    roles: Array<Roles>;
    createdMs: number;
  };

  export enum ClientAccessRestrictionTypes {
    Ip = "ip",
    Host = "host",
    Api = "api",
  }
  export type ClientAccessRestrictionAttributes = {
    value: string;
    createdMs: number;
  };

  export type UserAttributes<Roles extends string> = {
    name: string;
    roles: Array<Roles>;
    // banned, deleted, 2fa (boolean)
    createdMs: number;
  };

  export type EmailAttributes = {
    email: string;
    verifiedMs: number | null;
    createdMs: number;
  };

  export type VerificationCodeAttributes = {
    codeSha256: Buffer;
    type: "login" | "verification";
    email: string;
    userGeneratedToken: string | null;
    createdMs: number;
    expiredMs: number;
    consumedMs: number | null;
    invalidatedMs: number | null;
  };

  export type SessionAttributes = {
    userAgent: string | null;
    ip: string;
    invalidatedMs: number | null;
    createdMs: number;
    expiredMs: number;
  };

  /**
   *
   *
   * API namespace
   *
   *
   */
  export namespace Api {
    /**
     * Apis
     */
    export type Api = ApiAttributes & {
      id: string; // This will be `[domain]:[version]`
      type: "apis";
      active: boolean;
    };

    /**
     * Organizations, Clients and access restrictions
     */
    export type Organization = { id: string } & OrganizationAttributes;
    export type Client<Roles extends string> = ClientAttributes<Roles> & {
      id: string;
      type: "clients";
      organization: { data: { type: "organizations"; id: string } };
    };
    export type ClientAccessRestriction = ClientAccessRestrictionAttributes & {
      id: string;
      type: "ip-access-restrictions" | "host-access-restrictions" | "api-access-restrictions";
      client: {
        data: { type: "clients"; id: string };
      };
    };

    /**
     * Users and related
     */

    export type User<Roles extends string> = UserAttributes<Roles> & {
      id: string;
      type: "users";
      banned: boolean;
      deleted: boolean;
      "2fa": boolean;
    };

    export type PostUser = {
      name: string;
      email: string;
      password?: string;
      passwordConf?: string;
    };

    /**
     *
     * Authentication Flow Types
     *
     */

    export enum AuthnTypes {
      Email = "email",
      Password = "password",
      Code = "code",
      Totp = "totp",
    }

    export type AuthnRequest = {
      idType: AuthnTypes.Email | AuthnTypes.Code;
      idValue: string;
      state: string;
      secret?: string;
    };

    export type AuthnStep = {
      t: "step";
      step: AuthnTypes;
      code: string;
      state: string;
    };

    export type AuthnSession = {
      t: "session";
      token: string;
      refresh: string;
    };

    export type AuthnResponse = AuthnStep | AuthnSession;

    /**
     *
     * Collected Resources and API Responses
     *
     */
    export type Resource<ClientRoles extends string, UserRoles extends string> =
      | Api
      | AuthnStep
      | AuthnSession
      | Client<ClientRoles>
      | ClientAccessRestriction
      | Organization
      | PostUser
      | User<UserRoles>;

    export type Responses<ClientRoles extends string, UserRoles extends string> = {
      "GET /organizations": ApiTypes.CollectionResponse<
        Organization,
        Resource<ClientRoles, UserRoles>
      >;
      "GET /organizations/:id": ApiTypes.SingleResponse<
        Organization,
        Resource<ClientRoles, UserRoles>
      >;
    };
  }

  /**
   *
   *
   * Database namespace
   *
   *
   */
  export namespace Db {
    // Apis are identified by their domain and version, so no formal "id" property here
    export type Api = ApiAttributes & { active: 0 | 1; allowUnidentifiedReqs: 0 | 1 };
    export type Organization = { id: string } & OrganizationAttributes;
    export type Client = Omit<ClientAttributes<string>, "roles"> & {
      id: string;
      organizationId: string;
      secretBcrypt: string;
    };
    export type ClientRole<Roles extends string> = {
      clientId: string;
      roleId: Roles;
    };
    export type ClientAccessRestriction = {
      id: string;
      type: ClientAccessRestrictionTypes;
      clientId: string;
    } & ClientAccessRestrictionAttributes;
    export type User = Omit<UserAttributes<string>, "roles"> & {
      id: string;
      passwordBcrypt: string | null;
      banned: 0 | 1;
      deleted: 0 | 1;
      "2fa": 0 | 1;
    };
    export type UserRole<Roles extends string> = {
      userId: string;
      roleId: Roles;
    };
    export type Email = { userId: string } & EmailAttributes;
    export type VerificationCode = VerificationCodeAttributes;
    export type Session = { id: string; userId: string } & SessionAttributes;
    export type SessionToken = {
      type: "session" | "refresh";
      tokenSha256: Buffer;
      sessionId: string;
      createdMs: number;
      expiredMs: number;
      invalidatedMs: number | null;
    };
  }
}
