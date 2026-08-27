import { z } from "zod";

/**
 * Shared input bounds.
 *
 * Several schemas accepted unbounded strings, so a caller could store multi-
 * megabyte values (a 4.8 MB password was accepted with HTTP 200) and, on the
 * inbox-sources route, invent unlimited JSON keys. Every free-text field now has
 * an explicit ceiling.
 */

/** cuid()s are 25 chars; allow a little slack but never an unbounded id. */
export const zId = z.string().min(1).max(64);

export const zName = z.string().trim().min(1, "This field is required").max(120);
export const zTitle = z.string().trim().max(120);
export const zIcon = z.string().trim().max(8);
export const zShortText = z.string().trim().max(400);
export const zNote = z.string().max(2000);
export const zLongText = z.string().max(5000);

/**
 * bcrypt only reads the first 72 bytes, so anything longer is silently
 * truncated — cap it explicitly rather than pretending the extra characters
 * add strength, and reject obvious throwaways.
 */
export const zPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const zEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .max(254);

export const zScore = z.number().int().min(1).max(5);
