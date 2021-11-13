/**
 *
 *
 * General types having to do with API interactions
 *
 *
 */
export namespace Api {
  /**
   * A package of information about the current page being returned, including the number of items
   * selected for (which is not necessarily equal to the number of items returned), the way the page
   * is sorted, a cursor to use to obtain the next page, and a cursor to use to obtain the previous
   * page.
   */
  export type NextPageParams = {
    /** The number of items requested for the current page */
    size: number;
    /** A cursor that may be used to obtain the next page of results. `null` if there is no next page. */
    nextCursor: string | null;
    /** A cursor that may be used to obtain the previous page of results. `null` if there is no previous page. */
    prevCursor: string | null;
    /**
     * If the current page was sorted in a certain way, that paramter is specified here so it may
     * be used in subsequent calls to sort in the same way.
     */
    sort?: string | null;
  };

  /** A typical collection response */
  export type CollectionResponse<
    Resource extends unknown = unknown,
    Included extends unknown = unknown,
    Meta extends unknown = unknown
  > = {
    t: "collection";
    data: Array<Resource>;
    included?: Array<Included>;
    /** For collections, there is a definite `meta` key and it contains at least the Page parameters. */
    meta: Meta & { pg: NextPageParams };
  };

  /** A typical single resource response */
  export type SingleResponse<
    Resource extends unknown = unknown,
    Included extends unknown = unknown,
    Meta extends unknown = unknown
  > = {
    t: "single";
    data: Resource;
    included?: Array<Included>;
    meta?: Meta;
  };

  /** A typical error response */
  export type ErrorResponse<
    Meta extends unknown = unknown,
    Obstructions extends Obstruction = Obstruction
  > = {
    t: "error";
    error: {
      title: string;
      code?: string | null;
      status: number;
      detail: string;
      obstructions?: Array<Obstructions>;
    };
    meta?: Meta;
  };

  /** A null response */
  export type NullResponse<Meta extends unknown = unknown> = {
    t: "null";
    data: null;
    meta?: Meta;
  };

  /** Aggregate response type */
  export type Response<
    Resource extends unknown = unknown,
    Included extends unknown = unknown,
    Meta extends unknown = unknown,
    ErrorMeta extends unknown = Meta,
    Obstructions extends Obstruction = Obstruction
  > =
    | CollectionResponse<Resource, Included, Meta>
    | SingleResponse<Resource, Included, Meta>
    | ErrorResponse<ErrorMeta, Obstructions>
    | NullResponse<Meta>;

  /**
   * A resource identifier, used as a "pointer" to a full resource. This is usually part of the API
   * representation of an object.
   */
  export type ResourceIdentifier<Tag extends string> = {
    id: string;
    type: Tag;
  };

  /**
   * Describes a to-one relationship in an API response object. For example:
   *
   * ```ts
   * type User = {
   *   id: string;
   *   type: "users";
   *   name: string;
   *   email: string;
   *   bestFriend: {
   *     data: {
   *       id: string;
   *       type: "users";
   *     }
   *   }
   * }
   * ```
   */
  export type ToOneRelationship<
    T extends string,
    Nullable extends "nullable" | "non-nullable" = "non-nullable"
  > = {
    /** A resource identifier pointing to the related resource */
    data: Nullable extends "nullable" ? ResourceIdentifier<T> | null : ResourceIdentifier<T>;
    /** An optional collection of links describing additional actions you can take on this resource */
    links?: {
      /** The address by which you can obtain this resource's full data */
      self?: string;
    };
  };

  /**
   * Describes a to-many relationship in an API response object. For example:
   *
   * ```ts
   * type User = {
   *   id: string;
   *   type: "users";
   *   name: string;
   *   email: string;
   *   friends: {
   *     data: null | Array<{
   *       id: string;
   *       type: "users";
   *     }>;
   *     meta: {
   *       pg: NextPageParams;
   *     }
   *   }
   * }
   * ```
   *
   * If `data` is null, this indicates that the relationship has not yet been "inflated".
   */
  export type ToManyRelationship<T extends string> = {
    /** The resource identifiers pointing to the related resources */
    data: Array<ResourceIdentifier<T>> | null;
    /** An optional collection of links describing additional actions you can take on this resource */
    links?: {
      /** The address by which you can obtain this resource's full data */
      self?: string;
    };
    /** Additional information about the resources */
    meta?: {
      /** Information about the current page of resources */
      pg: NextPageParams;
    };
  };

  /**
   * Types that are intended for use on the server side of API implementations (i.e., internal to
   * the API server)
   */
  export namespace Server {
    /**
     * Parameters that can be passed to endopints retrieving collections
     *
     * Note: These two keys use the double-underscore (`__`) prefix because without such prefix they
     * may be indistinguishable from a constraint using arbitrary, user-defined fields. This was a
     * problem when developing the `@wymp/ts-sql` package, so the keys were changed here to
     * accommodate.
     * */
    export type CollectionParams = {
      /** Pagination options */
      __pg?:
        | undefined
        | {
            /** The size of the page */
            size?: number;

            /**
             * The cursor indicating which page to retreive. This value is intentionally opaque, and
             * is meant to be both consumed and produced by the underlying system. Often, it will
             * simply be a base64-encoded string indicating a page number, such as `num:5`.
             */
            cursor?: string | null;
          };

      /**
       * How to sort the collection. This should be a comma-separated list of sort fields using
       * either `+` (implied) or `-` to indicate sort order.
       */
      __sort?: undefined | string;
    };
  }

  /**
   * Types that are intended for use on the client side of API implementations (i.e., public-facing)
   */
  export namespace Client {
    /**
     * Defines the set of parameters that may be passed into the API via the query string to specify
     * page details and sorting of the result set. E.g.,
     * `GET /users?pg[size]=25&pg[cursor]=bnVtOjY%3D&sort=-createdDate%2C%2Bname
     */
    export type CollectionParams = {
      pg?: {
        size?: number;
        cursor?: string;
      };
      sort?: string;
    };
  }
}

type GenericParams = { [k: string]: GenericParams };
type Obstruction<Params extends GenericParams = GenericParams> = {
  code: string;
  text: string;
  params: Params;
};
