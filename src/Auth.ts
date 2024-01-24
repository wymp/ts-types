import { Api as ApiTypes } from "./Api";

/**
 * Auth types for the Wymp ecosystem.
 * 
 * This module contains types that outline a system for identification and authorization.
 * 
 * This module may be a bit ambitious.... It defines an entire Accounts API, which is a bit specific (and also
 * implemented in https://github.com/wymp/ts-auth-gateway/ as a sort of POC).
 * 
 * 
 * ### Concept
 * 
 * 
 * #### Identification, Authentication and Authorization
 * 
 * * _Identification_ is the process of determining who an entity claims to be.
 * * _Authentication_ is the process of verifying that the entity actually is who they say they are (using a secret or
 *   password).
 * * _Authorization_ is the process of verifying that the entity is allowed to do what they are trying to do.
 * 
 * In the auth paradigm defined by this module, we have **clients** and **users**. We identify clients by clientId and
 * users by userId. We authenticate clients using a secret key and users using a password and (optional) 2fa code. We
 * authorize clients and users using client roles and user roles. And (optionally) we _further_ authorize clients using
 * OAuth scopes granted by users.
 * 
 * 
 * #### Auth Data
 * 
 * In this system, a request may be associated with just a client (a computer-to-computer interaction) or a client and
 * a user (a user-to-computer interaction). In either case, the client may be authenticated or not. Generally speaking,
 * requests coming from front-end clients (e.g., your website) will NOT be authenticated, since you cannot safely
 * expose your client secret to the front-end. Requests coming from back-end clients (e.g., your internal services)
 * _should_ be authenticated so that you can prove they are genuine.
 * 
 * There is an additional layer in all of this which is not considered important to the authn/z system, and that is
 * "organizations". An organization is an arbitrary group of users. An organization is not considered an actor, so it
 * is not part of the primary authn/z system, but it is considered a first-class member of the "accounts" system.
 * 
 * 
 * #### Full Usage Example
 * 
 * As an example, let's say you run a service at https://my-domain.com that provides an API that other websites want to
 * use. Your API provides general data via endpoints at https://apis.my-domain.com/stats and user-specific data via
 * endpoints at https://apis.my-domain.com/users.
 * 
 * There is a third-party website, https://other-domain.com/app, that wants to use your service. Here's how that would
 * work:
 * 
 * 1. An admin from other-domain goes to https://my-domain.com/signup and creates an account. That account-creation
 *    request is identified by YOUR clientId, 12345; it is NOT authenticated (because it's a front-end request), and
 *    there is no user associated with it because they haven't been created yet.
 * 2. The creation is successful and a session is returned with user data. The admin goes and does some other things on
 *    your website, including creating a new client, id abcde. This creation request is identified by YOUR client, 12345,
 *    (because this is still your website); it's still unauthenticated because it's a front-end request, but now it's
 *    associated with the admin's authenticated user.
 * 3. Now the admin has their own client id, abcde. They get their website up and running and make a request to your
 *    general stats API, https://apis.my-domain.com/stats. This request is identified by THEIR client, abcde, and is
 *    NOT authenticated (because it's a front-end request).
 * 4. Meanwhile, they're server is making AUTHENTICATED requests to a private endpoint on your stats API. These requests
 *    are identified by THEIR client, abcde, and are authenticated using their client secret; however, they are not
 *    associated with a user.
 * 5. Finally, they take a user through an OAuth flow and obtain an OAuth token for the user from your site. They use
 *    that token to make requests to your user API, https://apis.my-domain.com/users, on behalf of the user. These
 *    requests are identified by THEIR client, abcde; they are NOT authenticated (front-end request); but they are
 *    now associated with the user, and they contain OAuth scopes that you can use to authorize the request.
 * 
 * The above example attempts to demonstrate the `ReqInfo` data that would be present in each of these cases. However,
 * _how_ you facilitate the transmission of this data is up to you. https://github.com/wymp/ts-auth-gateway/ provides
 * a full, working example of a system that does this.
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
  export type ReqInfo = ReqInfoString | ReqInfoBitwise;

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

  /** An Express Request object with an additional `auth` property containing ReqInfo for the request */
  export type AuthdReq<T> = T & { auth: ReqInfo };
  export type AuthdReqString<T> = T & { auth: ReqInfoString };
  export type AuthdReqBitwise<T> = T & { auth: ReqInfoBitwise };

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
      "POST /emails/:id/send-verification": { data: null };
      "POST /emails/:id/verify": ApiTypes.SingleResponse<Email, Resource<ClientRoles, UserRoles>>;

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
}
