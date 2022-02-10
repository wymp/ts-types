/**
 * This allows us to make specific fields optional (see https://stackoverflow.com/a/54178819/2065427)
 * Usually used for incoming data with default values
 */
export type PartialSelect<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
