import { Api as ApiTypes } from "./Api";
import { BufferLike } from "./Misc";

/**
 * The Auth type namespace for the Wymp ecosystem
 */
export namespace Auth {
  /**
   * This structure represents the expected authn/z info attached to any request made against the
   * system. Keys are as follows:
   *
   * t = "set" system (see below)
   * c = clientId
   * a = authenticated (i.e., provided a valid secret key)
   * r = client roles
   * ip = ip address from which the request originated
   * d = "debug mode" - This indicates that a valid debug key was passed and that debugging
   * features should be made available
   * u.sid = session id
   * u.id = user id
   * u.r = user roles
   * u.s = An optional array of scopes granted via oauth. If null or undefined, then this is a
   * direct user request and not an oauth request.
   *
   * Note that roles and scopes may be strings (e.g., "sysadmin", "employee", etc...) or numbers
   * representing bitwise values. You must specify which system you are using using the `t`
   * parameter, where 0 means Arrays of strings and 1 means bitwise numbers.
   *
   * **TODO: OAUTH IS NOT A WELL DEFINED CONCEPT FOR THIS LIBRARY RIGHT NOW. EVENTUALLY IT
   * WILL LIKELY BE BROKEN OUT INTO ITS OWN SEGMENT OF THE REQINFO OBJECT, BUT WE'RE NOT GOING TO
   * WORRY ABOUT IT FOR NOW.**
   */
  export type ReqInfoString = {
    t: 0;
    c: string;
    a: boolean;
    r: Array<string>;
    ip: string;
    d?: boolean;
    u?: {
      sid: string;
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
      sid: string;
      id: string;
      r: number;
      s?: number | null;
    };
  };
  export type ReqInfo = ReqInfoString | ReqInfoBitwise;
  export type AuthdReqString<T> = T & { auth: ReqInfoString };
  export type AuthdReqBitwise<T> = T & { auth: ReqInfoBitwise };
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
    // 2fa (boolean)
    createdMs: number;
    bannedMs: number;
    deletedMs: number;
  };

  export type EmailAttributes = {
    verifiedMs: number | null;
    createdMs: number;
  };

  export type VerificationCodeAttributes = {
    codeSha256: BufferLike;
    type: "login" | "verification";
    email: string;
    userGeneratedToken: string | null;
    createdMs: number;
    expiresMs: number;
    consumedMs: number | null;
    invalidatedMs: number | null;
  };

  export type SessionAttributes = {
    userAgent: string | null;
    ip: string;
    invalidatedMs: number | null;
    createdMs: number;
    expiresMs: number;
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
    export type Organization = {
      id: string;
      type: "organizations";
    } & OrganizationAttributes;
    export type Client<Roles extends string> = ClientAttributes<Roles> & {
      id: string;
      type: "clients";
      organization: { data: { type: "organizations"; id: string } };
    };
    export type ClientRole<Roles extends string> = {
      id: Roles;
      type: "client-roles";
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
      "2fa": boolean;
      emails: {
        data: null | Array<{ type: "emails"; id: string }>;
      };
    };

    export type UserRole<Roles extends string> = {
      id: Roles;
      type: "user-roles";
    };

    export type PostUser = {
      name: string;
      email: string;
      password?: string;
      passwordConf?: string;
    };

    export type Email = EmailAttributes & {
      id: string;
      type: "emails";
    };

    export type Session = { id: string } & SessionAttributes;

    export type OrgMembership = {
      id: string;
      type: "org-memberships";
      user: { data: { type: "users"; id: string } };
      organization: { data: { type: "organizations"; id: string } };
      read: boolean;
      edit: boolean;
      manage: boolean;
      delete: boolean;
    };

    /**
     *
     * Authentication Flow Types
     *
     */

    export namespace Authn {
      export enum Types {
        Email = "email",
        Password = "password",
        Code = "code",
        Totp = "totp",
      }

      export type StepResponse = {
        t: "step";
        step: Authn.Types;
        code: string;
        state: string;
      };

      export type Session = {
        t: "session";
        token: string;
        refresh: string;
      };

      export type Response = StepResponse | Session;
    }

    /**
     *
     * Collected Resources and API Responses
     *
     */
    export type Resource<ClientRoles extends string, UserRoles extends string> =
      | Api
      | Authn.StepResponse
      | Authn.Session
      | Client<ClientRoles>
      | ClientAccessRestriction
      | Email
      | Organization
      | OrgMembership
      | PostUser
      | Session
      | User<UserRoles>;

    export type Responses<ClientRoles extends string, UserRoles extends string> = {
      // Organizations
      "GET /organizations": ApiTypes.CollectionResponse<
        Organization,
        Resource<ClientRoles, UserRoles>
      >;
      "GET /organizations/:id": ApiTypes.SingleResponse<
        Organization,
        Resource<ClientRoles, UserRoles>
      >;
      "POST /organizations": ApiTypes.SingleResponse<
        Organization,
        Resource<ClientRoles, UserRoles>
      >;

      // Sessions
      "GET /sessions": ApiTypes.CollectionResponse<Session, Resource<ClientRoles, UserRoles>>;
      "POST /sessions/login/email": { data: null };
      "POST /sessions/login/password": { data: Authn.StepResponse | Authn.Session };
      "POST /sessions/login/code": { data: Authn.StepResponse | Authn.Session };
      "POST /sessions/login/totp": { data: Authn.StepResponse | Authn.Session };
      "POST /sessions/refresh": { data: Authn.Session };
      "POST /sessions/invalidate": { data: null };

      // Users
      "GET /users": ApiTypes.CollectionResponse<User<UserRoles>, Resource<ClientRoles, UserRoles>>;
      "GET /users/:id": ApiTypes.SingleResponse<User<UserRoles>, Resource<ClientRoles, UserRoles>>;
      "POST /users": { data: Authn.Session };
      "PATCH /users/:id": ApiTypes.SingleResponse<
        User<UserRoles>,
        Resource<ClientRoles, UserRoles>
      >;
      "DELETE /users/:id": { data: null };

      // User Roles
      "GET /users/:id/roles": ApiTypes.CollectionResponse<UserRole<UserRoles>>;
      "POST /users/:id/roles": ApiTypes.CollectionResponse<UserRole<UserRoles>>;
      "DELETE /users/:id/roles/:id": { data: null };

      // User Emails
      "GET /users/:id/emails": ApiTypes.CollectionResponse<Email, Resource<ClientRoles, UserRoles>>;
      "POST /users/:id/emails": ApiTypes.SingleResponse<Email, Resource<ClientRoles, UserRoles>>;
      "DELETE /users/:id/emails/:id": { data: null };
      "POST /users/:id/emails/:id/generate-verification": { data: null };
      "POST /users/:id/emails/:id/verify": ApiTypes.SingleResponse<
        Email,
        Resource<ClientRoles, UserRoles>
      >;

      // Clients
      "GET /organizations/:id/clients": ApiTypes.CollectionResponse<
        Client<ClientRoles>,
        Resource<ClientRoles, UserRoles>
      >;
      "POST /organizations/:id/clients": ApiTypes.SingleResponse<
        Client<ClientRoles> & { secret: string },
        Resource<ClientRoles, UserRoles>
      >;
      "GET /organizations/:id/clients/:id": ApiTypes.SingleResponse<
        Client<ClientRoles>,
        Resource<ClientRoles, UserRoles>
      >;
      "PATCH /organizations/:id/clients/:id": ApiTypes.SingleResponse<
        Client<ClientRoles>,
        Resource<ClientRoles, UserRoles>
      >;
      "DELETE /organizations/:id/clients/:id": { data: null };
      "POST /organizations/:id/clients/:id/refresh-secret": ApiTypes.SingleResponse<
        Client<ClientRoles> & { secret: string },
        Resource<ClientRoles, UserRoles>
      >;

      // Client Roles
      "GET /organizations/:id/clients/:id/roles": ApiTypes.CollectionResponse<
        ClientRole<ClientRoles>
      >;
      "POST /organizations/:id/clients/:id/roles": ApiTypes.CollectionResponse<
        ClientRole<ClientRoles>
      >;
      "DELETE /organizations/:id/clients/:id/roles/:id": { data: null };

      // Client Access Restrictions
      "GET /organizations/:id/clients/:id/access-restrictions": ApiTypes.CollectionResponse<ClientAccessRestriction>;
      "POST /organizations/:id/clients/:id/access-restrictions": ApiTypes.SingleResponse<ClientAccessRestriction>;
      "DELETE /organizations/:id/clients/:id/access-restrictions/:id": { data: null };

      // Organization memberships
      "GET /users/:id/memberships": ApiTypes.CollectionResponse<
        OrgMembership,
        Resource<ClientRoles, UserRoles>
      >;
      "GET /organizations/:id/memberships": ApiTypes.CollectionResponse<
        OrgMembership,
        Resource<ClientRoles, UserRoles>
      >;
      "POST /organizations/:id/memberships": ApiTypes.CollectionResponse<
        OrgMembership,
        Resource<ClientRoles, UserRoles>
      >;
      "DELETE /org-memberships/:id": { data: null };
      "PATCH /org-memberships/:id": ApiTypes.SingleResponse<
        OrgMembership,
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
      deletedMs: null | number;
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
      "2fa": 0 | 1;
    };
    export type UserRole<Roles extends string> = {
      userId: string;
      roleId: Roles;
    };
    export type Email = { id: string; userId: string } & EmailAttributes;
    export type VerificationCode = VerificationCodeAttributes;
    export type Session = { id: string; userId: string } & SessionAttributes;
    export type SessionToken = {
      type: "session" | "refresh";
      tokenSha256: BufferLike;
      sessionId: string;
      createdMs: number;
      expiresMs: number;
      consumedMs: number | null;
      invalidatedMs: number | null;
    };

    export type UserClient = {
      userId: string;
      clientId: string;
      createdMs: number;
    };
    export type OrgMembership = {
      id: string;
      userId: string;
      organizationId: string;
      read: 1 | 0;
      edit: 1 | 0;
      manage: 1 | 0;
      delete: 1 | 0;
    };
  }
}
