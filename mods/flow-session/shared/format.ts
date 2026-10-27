/** Whole thousands, such as `152k`. */
export const kilo = (tokens: number) => `${Math.round(tokens / 1000)}k`

/** An error's message, for a log line. */
export const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error))
