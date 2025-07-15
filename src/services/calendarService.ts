import { supabase } from "../config/supabaseClient";
import { UserData } from "../context/AuthContext";

export type EventData = {
  id: string;
  creator_id: string;
  group_id?: string | null;
  title?: string;
  description?: string;
  start_time?: string | null;
  end_time?: string | null;
};

export type ConfirmedEvent = {
  id: string;
  creator_id: string;
  group_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
};

export type UserEvent = Omit<EventData, "id" | "creator_id">;

/**
 * Fetches events that the user is attending
 *
 * @returns list of event data
 */
export async function getEvents(userId: string): Promise<EventData[]> {
  const { data, error } = await supabase
    .from("user_event")
    .select(`event(*)`)
    .eq("user_id", userId)
    .eq("status", "attending")
    .order("start_time", { referencedTable: "event" });

  if (error) {
    console.error("Failed to fetch events:", error.message);
    throw error;
  }

  const events = data as unknown as { event: EventData }[];

  return events.map(({ event }) => event);
}

/**
 * Fetches the details of an event given its id
 *
 * @param eventId
 * @returns event data
 */
export async function getEvent(eventId: string): Promise<EventData> {
  const { data, error } = await supabase
    .from("event")
    .select()
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Failed to fetch event:", error.message);
    throw error;
  }

  return data;
}

/**
 * Fetches events attended by all users in a given list of users
 *
 * @param userIds
 * @returns list of events
 */
export async function getSharedEvents(userIds: string[]): Promise<EventData[]> {
  const { data, error } = await supabase
    .from("user_event")
    .select(`event_id`)
    .in("user_id", userIds)
    .eq("status", "attending");

  if (error) {
    console.error("Failed to fetch shared events:", error.message);
    throw error;
  }

  const eventIds: string[] = data.map(({ event_id }) => event_id);

  const eventCount = new Map<string, number>();

  for (const eventId of eventIds) {
    eventCount.set(eventId, (eventCount.get(eventId) || 0) + 1);
  }

  const sharedEventIds = Array.from(eventCount.entries())
    .filter(([_, count]) => count === userIds.length)
    .map(([event]) => event);

  const { data: events, error: eventError } = await supabase
    .from("event")
    .select()
    .in("id", sharedEventIds);

  if (eventError) {
    console.error("Failed to fetch shared events:", eventError.message);
    throw eventError;
  }

  return events;
}

/**
 * Creates an event with guest list
 *
 * If no attendees are provided, creates an individual event
 *
 * @param event
 * @param attendeeIds
 */
export async function createEvent(
  event: UserEvent,
  creatorId: string,
  attendeeIds?: string[],
  groupId?: string
) {
  const eventId = await addEvent(event, groupId);
  await addAttendee(eventId, creatorId);

  if (attendeeIds) {
    await sendEventInvites(eventId, attendeeIds);
  }
}

/**
 * Adds events created by the user
 *
 * @param events
 */
export async function addEvents(events: UserEvent[], source?: string) {
  const eventsToInsert = source
  ? events.map((event) => ({ ...event, source }))
  : events;

  const { data, error } = await supabase
    .from("event")
    .insert(eventsToInsert)
    .select("id");

  if (error) {
    console.error("Failed to add events:", error.message);
    throw error;
  }

  const newEvents: { event_id: string; status: string }[] = data.map(
    (event) => ({ event_id: event.id, status: "attending" })
  );

  const { error: eventError } = await supabase
    .from("user_event")
    .insert(newEvents);

  if (eventError) {
    console.error("Failed to add events:", eventError.message);
    throw error;
  }
}

/**
 * Adds an event created by the user
 *
 * @param event
 * @returns event id
 */
export async function addEvent(
  event: UserEvent,
  groupId?: string
): Promise<string> {
  if (groupId) {
    event = { ...event, group_id: groupId };
  }

  const { data, error } = await supabase
    .from("event")
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error("Failed to add event:", error.message);
    throw error;
  }

  return data.id;
}

/**
 * Updates an event given its id and new details
 *
 * @param eventId
 * @param updatedEvent
 */
export async function updateEvent(eventId: string, updatedEvent: UserEvent) {
  const { error } = await supabase
    .from("event")
    .update(updatedEvent)
    .eq("id", eventId);

  if (error) {
    console.error("Failed to update event:", error.message);
    throw error;
  }
}

/**
 * Deletes an event given its id
 *
 * @param eventId
 */
export async function deleteEvent(eventId: string) {
  const { error } = await supabase.from("event").delete().eq("id", eventId);

  if (error) {
    console.error("Failed to delete event:", error.message);
    throw error;
  }
}

/**
 * Fetches events the user has been invited to
 *
 * @param userId
 * @returns list of events
 */
export async function getEventInvites(userId: string): Promise<EventData[]> {
  const { data, error } = await supabase
    .from("user_event")
    .select(`event(*)`)
    .eq("user_id", userId)
    .eq("status", "invited");

  if (error) {
    console.error("Failed to fetch event invites:", error.message);
    throw error;
  }

  const events = data as unknown as { event: EventData }[];

  return events.map(({ event }) => event);
}

/**
 * Invite users to an event
 *
 * @param eventId
 * @param inviteeIds
 */
export async function sendEventInvites(eventId: string, inviteeIds: string[]) {
  const attendees = inviteeIds.map((inviteeId) => ({
    user_id: inviteeId,
    event_id: eventId,
  }));

  const { error } = await supabase.from("user_event").insert(attendees);

  if (error) {
    console.error("Failed to invite users:", error.message);
    throw error;
  }
}

/**
 * Accepts or declines an event invite
 *
 * @param eventId
 * @param status
 */
export async function respondToInvite(
  userId: string,
  eventId: string,
  status: "attending" | "declined"
) {
  const { error } = await supabase
    .from("user_event")
    .update({ status: status })
    .eq("user_id", userId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Failed to respond to invite:", error.message);
    throw error;
  }
}

/**
 * Fetches attendees of an event
 *
 * @param eventId
 * @returns list of user data
 */
export async function getAttendees(eventId: string): Promise<UserData[]> {
  const { data, error } = await supabase
    .from("user_event")
    .select(`user(*)`)
    .eq("event_id", eventId)
    .eq("status", "attending");

  if (error) {
    console.error("Failed to fetch attendees:", error.message);
    throw error;
  }

  const users = data as unknown as { user: UserData }[];

  return users.map(({ user }) => user);
}

/**
 * Adds a user to an event as an attendee
 *
 * @param eventId
 * @param attendeeId
 */
export async function addAttendee(eventId: string, attendeeId: string) {
  const { error } = await supabase
    .from("user_event")
    .insert({ user_id: attendeeId, event_id: eventId, status: "attending" });

  if (error) {
    console.error("Failed to add attendee:", error.message);
    throw error;
  }
}

/**
 * Removes a user from an event
 *
 * @param eventId
 * @param userId
 */
export async function removeUser(eventId: string, userId: string) {
  const { error } = await supabase
    .from("user_event")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Failed to remove user:", error.message);
    throw error;
  }
}

/**
 * Fetches available timings for an event
 *
 * @param eventId
 * @returns list of time intervals
 */
export async function getTimings(eventId: string) {
  const { data, error } = await supabase.rpc("get_attendees_schedules", {
    _event_id: eventId,
  });

  if (error) {
    console.error("Failed to fetch schedules:", error.message);
    throw error;
  }

  const events = data as {
    id: string;
    creator_id: string;
    group_id?: string | null;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
  }[];

  const intervals = events.map((event) => [
    new Date(event.start_time).getTime(),
    new Date(event.end_time).getTime(),
  ]);

  const now = new Date().getTime();
  const oneWeekLater = now + 7 * 24 * 60 * 60 * 1000;

  return getMissingIntervals(intervals, now, oneWeekLater).map((interval) => ({
    start: new Date(interval[0]).toISOString(),
    end: new Date(interval[1]).toISOString(),
  }));
}

/**
 * Given a sorted list of intervals and a range, return the complement list of intervals
 *
 * @param intervals
 * @param rangeStart
 * @param rangeEnd
 * @returns list of intervals
 */
function getMissingIntervals(
  intervals: number[][],
  rangeStart: number,
  rangeEnd: number
) {
  const missing = [];

  let prevEnd = rangeStart;

  for (const interval of intervals) {
    const start = interval[0];
    const end = interval[1];

    if (start > prevEnd) {
      missing.push([prevEnd, start]);
    }

    prevEnd = Math.max(prevEnd, end);
  }

  if (prevEnd < rangeEnd) {
    missing.push([prevEnd, rangeEnd]);
  }

  return missing;
}

/**
 * Deletes all events created by user that were imported from NUSMods
 * 
 * @param userId 
 */
export async function deleteNUSMODsEvents(userId: string) {
  const { data, error: checkError } = await supabase
    .from("event")
    .select("id")
    .eq("creator_id", userId)
    .eq("source", "nusmods");

  if (checkError) {
    console.error("Error checking NUSMODs events:", checkError.message);
    throw new Error("Failed to check existing timetable.");
  }

  if (data.length === 0) return;

  const confirm = window.confirm(
    "This action will delete your previously imported NUSMODs timetable. Continue?"
  );
  if (!confirm) return;

  const { error: deleteError } = await supabase
    .from("event")
    .delete()
    .eq("creator_id", userId)
    .eq("source", "nusmods");

  if (deleteError) {
    console.error("Failed to delete previous timetable:", deleteError.message);
    throw new Error("Could not delete previous timetable.");
  }
}

/**
 * Finalises a pending event by setting its start and end time.
 * Only the creator of the event is allowed to do this.
 * 
 * @param userId - ID of the creator of the event
 * @param eventId - ID of the event to finalise
 * @param newDetails - New details to update the event with
 */
export async function finaliseEvent(
  userId: string,
  eventId: string,
  newDetails: Partial<Pick<UserEvent, "start_time" | "end_time" | "title" | "description">>
) {
  const { data: event, error } = await supabase
  .from("event")
  .select("creator_id")
  .eq("id", eventId)
  .single();

  if (error) {
    console.error("Failed to verify event:", error.message);
    throw new Error("Failed to find event.");
  }

  if (event.creator_id !== userId) {
    throw new Error("Only the event creator can finalise the event.");
  }

  const { error: updateError } = await supabase
  .from("event")
  .update(newDetails)
  .eq("id", eventId);

  if (updateError) {
    console.error("Failed to finalise event:", updateError.message);
    throw new Error("Failed to finalise event.");
  }
}
