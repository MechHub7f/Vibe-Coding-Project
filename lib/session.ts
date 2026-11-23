export type Session =
  | { kind: "guest" }
  | { kind: "user"; userId: string; name: string; symbols: string[] };

/**
 * The single auth seam. v1 is always a guest (public, read-only).
 *
 * When accounts land in v2, replace this function with a real session lookup.
 * Nothing else should need to change: callers already go through here.
 */
export function getSession(): Session {
  return { kind: "guest" };
}
