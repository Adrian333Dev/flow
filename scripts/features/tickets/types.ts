import type { Group } from './groups.ts';

/** A ticket as `store.readTickets` returns it: the parsed `ticket.md` and where it sits. */
interface Ticket {
  id: string;
  dirName: string;
  dir: string;
  file: string;
  root: string;
  body: string;
  data: Record<string, any>;
  // The parked group holding it, or ''. Never written: the card is what holds it.
  held?: string;
}

/** Every ticket of one place, with the place's word as `prefix`, its `counter` and its `groups`. */
type TicketList = Ticket[] & { prefix: string; counter?: number; groups?: Group[] };

export type { Ticket, TicketList };
