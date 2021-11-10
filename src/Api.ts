/**
 *
 *
 * General types having to do with API interactions
 *
 *
 */
export namespace Api {
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

  /**
   * A package of information about the current page being returned, including the number of items
   * selected for (which is not necessarily equal to the number of items return), the way the page
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
}

type GenericParams = { [k: string]: GenericParams };
type Obstruction<Params extends GenericParams = GenericParams> = {
  code: string;
  text: string;
  params: Params;
};
