/**
 * General types having to do with API interactions.
 * 
 * At a high level, this is an attempt to define a "good enough" standard set of types for requests, responses,
 * pagination, sorting, and filtering. It is somewhat experimental and under active development, but may still provide
 * value, at least as an idea.
 * 
 * 
 * ### High-Level Overview
 * 
 * The basic idea here is that you make a request, and the response you receive contains all of the information you
 * might need to either do the thing you wanted to do, get the next page of results, or - in the event of an error -
 * communicate clearly to the user what went wrong and how to fix it. Additionally, the response is structured in such
 * a way that you can easily build powerful HTTP client libraries around it
 * (see https://luminous-money.github.io/ts-client for an example, and in particular
 * https://luminous-money.github.io/ts-client/classes/Client.html#next).
 * 
 * In this particular case, I've left requests up to you. The important thing (for collections) is that on the server,
 * you return the input params along with the response. This is what allows the client to know how to get the next page
 * of results.
 * 
 * Here's an example of a request-response cycle using these types:
 * 
 * ```ts
 * // These are arbitrary, but just to demonstrate how you _could_ format a request
 * const params = {
 *   'pg[size]': 25,
 *   'pg[cursor]': 'bnVtOjY=',
 *   'sort': '-createdDate,+name',
 *   'include': 'friends.id,friends.name,friends.email',
 *   'filter[createdDateGt]': new Date('2023-01-01T00:00:00.000Z').getTime(),
 * }
 * const stringifyParams = (params: Record<string, string>) => Object.entries(params)
 *   .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
 *   .join('&');
 * const endpoint = 'https://my-service.com/api/v1/users';
 * const res: Response<User> = await httpClient.get(`${endpoint}?${stringifyParams(params)}`);
 * 
 * if (res.t !== 'collection') throw new Error('Expected a collection response');
 * 
 * // Do something with the users collection .....
 * 
 * // Now if the response has a nextCursor, there's another page
 * if (res.meta.pg.nextCursor) {
 *   params['pg[cursor]'] = res.meta.pg.nextCursor;
 *   const nextRes: Response<User> = await httpClient.get(`${endpoint}?${stringifyParams(params)}`);
 *   // ....
 * }
 * ```
 * 
 * 
 * ### Pagination
 * 
 * The pagination scheme detailed here is cursor-based; HOWEVER, that does not necessarily mean that it does not still
 * use page numbers under the hood. The intention here was to leave that up to you. In the simplest case, a "cursor" can
 * be something like `Buffer.from('num:3').toString("base64")` - which is to say, a base64-encoded string representing
 * the page number. However, using the idea of a cursor accommodates more complex pagination schemes as well and is thus
 * preferable to having different shapes based on the pagination scheme you're using.
 * 
 * Pagination is by far the trickiest problem this structure attempts to solve. Since the unpaginated result set is
 * defined by both the filter and sort, those parameters are essential for the paginated result set as well. This is why
 * they are included in the response. The idea is that you can simply pass them back in to the next request to get the
 * next page of results.
 * 
 * (TODO: Currently `filter` is not included in the result. `sort` IS included because sometimes the server will
 * automatically apply a sort to the result set. Why is filter not included?? And should we include it?)
 * 
 * 
 * ### Response Types
 * 
 * This module defines three "success" response types and an error response type. In general, your API client should
 * throw an error if it receives an error response. The `t` property on these responses allows you to easily distinguish
 * between them. The three success response types are "single", "collection" and "null". Null responses may happen on
 * delete or on some other API call that doesn't really return any data. In my opinion, it's nice to have consistent
 * response shapes, so I've included it here. However, you could argue it doesn't actually add much.
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
     * If the current page was sorted in a certain way, that parameter is specified here so it may
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
    Obstructions extends ObstructionInterface = ObstructionInterface
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

  /**
   * A null response
   * 
   * This is something you might return on, for example, a `DELETE` request. It simply indicates that the
   * request was successful but that there was no data to return.
   */
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
    Obstructions extends ObstructionInterface = ObstructionInterface
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
     * Parameters that can be passed to endpoints retrieving collections
     *
     * Note: These two keys use the double-underscore (`__`) prefix because without such prefix they
     * may be indistinguishable from a constraint using arbitrary, user-defined fields. This was a
     * problem when developing the `@wymp/ts-sql` package, so the keys were changed here to
     * accommodate.
     * 
     * You'll typically translate the Client.CollectionParams into this type by analyzing the incoming request.
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
     * page details, sorting and filtering of the result set. E.g.,
     * `GET /users?pg[size]=25&pg[cursor]=bnVtOjY%3D&sort=-createdDate%2C%2Bname&include=bestFriend.name&filter=%7B%22date%22%3A%7B%22start%22%3A123456789%2C%22end%22%3A123456790%7D%7D`
     *
     * Note that actual values for `sort`, `include`, and `filter` are dependent on the system in
     * which they are received. The _intention_ for Wymp services is that `sort` be a comma-separated
     * list of fields with a `-` prefix indicating "descending sort"; `include` be a comma-separated
     * list of dot-addressed fields corresponding to the objects being retrieved; and `filter` be a
     * generic value that you can specify from the outside and which is serialized and sent as JSON.
     */
    export type CollectionParams<Filter = unknown> = {
      pg?: {
        size?: number;
        cursor?: string;
      };
      sort?: string;
      include?: string;
      filter?: Filter;
    };
  }
}

/** (Copy-pasted from [@wymp/http-errors](wymp.github.io/ts-http-errors)) */
export type ObstructionInterface<Code extends string = string, Data = undefined> = Data extends undefined
  ? { code: Code; text: string }
  : { code: Code; text: string; data: Data };