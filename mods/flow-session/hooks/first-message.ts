/**
 * first-message.ts: the one message a restarted session starts from.
 */

export function firstMessage(message: string): string {
  return ['This session restarted. The message below is what the last stretch of work left for this one.', message].join('\n\n')
}
