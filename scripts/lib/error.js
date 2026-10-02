'use strict';

/** A failure the user should see as a message, not a stack trace. */
class FlowError extends Error {}

module.exports = { FlowError };
