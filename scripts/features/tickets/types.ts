/** A ticket as `store.readTickets` returns it: the parsed `ticket.md` and where it sits. */
interface Ticket {
  id: string;
  dirName: string;
  dir: string;
  file: string;
  root: string;
  body: string;
  data: Record<string, any>;
}

/** Every ticket of one place, with the place's word as `prefix` and its `counter`. */
type TicketList = Ticket[] & { prefix: string; counter?: number };

export type { Ticket, TicketList };
