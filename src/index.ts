export { Auth } from "./Auth";

/**
 *
 *
 * Global API result pagination stuff
 *
 *
 */

export type CollectionParams = {
  pg?:
    | undefined
    | {
        size?: number;
        cursor?: string | null;
      };
  sort?: undefined | string;
};

export type CollectionResult<Resource extends unknown = unknown, Included extends unknown = unknown> = {
  data: Array<Resource>;
  included?: Array<Included>;
  meta: {
    pg: {
      size: number;
      nextCursor: string | null;
      prevCursor: string | null;
    };
  };
};

