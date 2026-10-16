/**
 * What hours can be logged against. Lives outside the client components so
 * server components can use it too: a constant exported from a "use client"
 * module arrives on the server as a client reference, not as the array.
 */
export const HOUR_CATEGORIES = ["Analysis", "Formulation work", "Meeting", "Report writing", "Other"];
