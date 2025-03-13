import { EVENT_HISTORY_LENGTH } from '@/constants';
import { createContext, PropsWithChildren, useContext, useState } from 'react';

export enum EventType {
  'INITIAL',
  'FIRST_INIT',
  'ROOM_MEMBER_MAP_UPD',
  'INVITATION_ANSWER',
}

export type Event = {
  type: EventType;
  payload?: any;
};

type TEventContext = {
  event: Event;
  emitEvent: (event: Event) => void;
};

const EventContext = createContext<TEventContext>({
  event: { type: EventType.INITIAL },
  emitEvent: () => {},
});

export const useEvent = () => {
  const value = useContext(EventContext);
  return value;
};

const EventProvider = ({ children }: PropsWithChildren) => {
  const [events, setEvents] = useState<Event[]>([]);

  const emitEvent = (event: Event) => {
    setEvents((prevEvents) => {
      const prevEventsSliced = prevEvents.slice(0, EVENT_HISTORY_LENGTH - 1);
      return [event, ...prevEventsSliced];
    });
  };

  const value = {
    event: events[0],
    emitEvent,
  };

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
};

export default EventProvider;
