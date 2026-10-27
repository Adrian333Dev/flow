/** A failure the user should see as a message, not a stack trace. */
class FlowError extends Error {
  /** The files a `flow sync` merge stopped on. */
  clash?: string[];
}

export { FlowError };
