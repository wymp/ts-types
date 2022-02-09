/**
 * This allows us to make specific fields optional (see https://stackoverflow.com/a/54178819/2065427)
 * Usually used for incoming data with default values
 */
export type PartialSelect<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * A minimal definition for something that can stand in as a NodeJS Buffer
 */

export type CharacterEncodings = "utf8" | "hex" | "base64" | "utf16";
export interface BufferLike {
  toString(encoding?: string, start?: number, end?: number): string;
  slice(start?: number, end?: number): BufferLike;
  indexOf(value: string | number | BufferLike, byteOffset?: number, encoding?: string): number;
  lastIndexOf(value: string | number | BufferLike, byteOffset?: number, encoding?: string): number;
  includes(value: string | number | BufferLike, byteOffset?: number, encoding?: string): boolean;
}
