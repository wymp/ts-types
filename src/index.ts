/**
 *
 *
 *
 *
 * Auth
 *
 *
 *
 *
 */

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
    u?: {
      id: string;
      r: number;
      s?: number | null;
    };
  };
  export type ReqInfo = ReqInfoString | ReqInfoBitwise;
}
