import { supabase } from "../config/supabaseClient";
import { UserData } from "../context/AuthContext";

export type EventData = {
  id: string;
  creator_id: string;
  group_id?: string | null;
  recurrence?: "weekly" | "monthly" | "annually";
  recurrence_group_id?: string | null;
  repeat_until?: string;
  title?: string;
  description?: string;
  start_time?: string | null;
  end_time?: string | null;
  label: "compulsory" | "flexible" | "optional" | "";
};

export type ConfirmedEvent = {
  id: string;
  creator_id: string;
  group_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  recurrence: string | null;
  repeat_until: string | null;
};

export type UserEvent = Omit<EventData, "id" | "creator_id"> & {
  recurrence?: "weekly" | "monthly" | "annually";
  repeat_until?: string;
  recurrence_group_id?: string;
  label: "compulsory" | "flexible" | "optional" | "";
};

export type PollTiming = {
  id: string;
  start_time: string;
  end_time: string;
  votes: number;
};

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
  const isRecurring =
    !!event.recurrence && !!event.repeat_until && !!event.recurrence_group_id;
  const isPending = !event.start_time || !event.end_time;

  if (isRecurring && isPending) {
    const { data, error } = await supabase
      .from("event")
      .insert([
        {
          ...event,
          creator_id: creatorId,
          group_id: groupId || null,
          start_time: null,
          end_time: null,
        },
      ])
      .select("id");

    if (error) {
      console.error("Failed to add base recurring event:", error.message);
      throw error;
    }

    const baseId = data[0].id;

    const attendanceRecords = [
      {
        event_id: baseId,
        user_id: creatorId,
        status: "attending",
      },
      ...(attendeeIds || []).map((uid) => ({
        event_id: baseId,
        user_id: uid,
        status: "invited",
      })),
    ];

    const { error: userEventError } = await supabase
      .from("user_event")
      .insert(attendanceRecords);

    if (userEventError) {
      console.error(
        "Failed to create user_event entries:",
        userEventError.message
      );
      throw userEventError;
    }

    return;
  }

  if (isRecurring && !isPending) {
    const recurringEvents = generateRecurringEvents(event, event.repeat_until!);

    const { data, error } = await supabase
      .from("event")
      .insert(
        recurringEvents.map((e) => ({
          ...e,
          creator_id: creatorId,
          group_id: groupId || null,
        }))
      )
      .select("id");

    if (error) {
      console.error("Failed to add recurring events:", error.message);
      throw error;
    }

    const eventIds = data.map((row) => row.id);

    const attendanceRecords = [
      ...eventIds.map((id) => ({
        event_id: id,
        user_id: creatorId,
        status: "attending",
      })),
      ...(attendeeIds || []).flatMap((uid) =>
        eventIds.map((id) => ({
          event_id: id,
          user_id: uid,
          status: "invited",
        }))
      ),
    ];

    const { error: userEventError } = await supabase
      .from("user_event")
      .insert(attendanceRecords);

    if (userEventError) {
      console.error(
        "Failed to create user_event entries:",
        userEventError.message
      );
      throw userEventError;
    }

    return;
  }

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
export async function addEvents(events: UserEvent[], source?: string, userId?: string) {
  const eventsToInsert = events.map((event) => ({
    ...event,
    source: source || null,
    creator_id: userId,
  }));

  const { data, error } = await supabase
    .from("event")
    .insert(eventsToInsert)
    .select("id");

  if (error) {
    console.error("Failed to add events:", error.message);
    throw error;
  }

  const newEvents: { event_id: string; status: string }[] = data.map(
    (event) => ({ event_id: event.id, user_id: userId, status: "attending" })
  );

  const { error: eventError } = await supabase
    .from("user_event")
    .insert(newEvents);

  if (eventError) {
    console.error("Failed to add events:", eventError.message);
    throw eventError;
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

  if (event.start_time === "") event.start_time = null;
  if (event.end_time === "") event.end_time = null;

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
  const { data: current, error: fetchError } = await supabase
    .from("event")
    .select("recurrence_group_id")
    .eq("id", eventId)
    .single();

  if (fetchError) {
    console.error("Failed to fetch current event before update:", fetchError.message);
    throw fetchError;
  }

  const safeUpdate = {
    ...updatedEvent,
    recurrence_group_id:
      updatedEvent.recurrence_group_id ?? current.recurrence_group_id ?? null,
  };

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
  if (!eventId || eventId.trim() ==="") {
    throw new Error("Invalid event ID passed to getTimings()");
  }

  const { data, error } = await supabase.rpc("get_attendees_schedules", {
    _event_id: eventId,
  });

  if (error) {
    console.error("Failed to fetch schedules:", error.message);
    throw error;
  }

  const events = data as any[];
  const now = new Date().getTime();
  const threeMonthsLater = now + 90 * 24 * 60 * 60 * 1000;

  const allIntervals: number[][] = [];
  const compulsoryIntervals: number[][] = [];
  const flexibleEvents: any[] = [];

  for (const event of events) {
    const start = new Date(event.start_time).getTime();
    const end = new Date(event.end_time).getTime();
    if (end < now) continue;

    allIntervals.push([start, end]);

    if (event.label === "compulsory" || !event.label) {
      compulsoryIntervals.push([start, end]);
    } else {
      flexibleEvents.push({ start, end, ...event });
    }
  }

  // Good to Go
  const pureFreeTime = getMissingIntervals(allIntervals, now, threeMonthsLater);
  const goodToGo = pureFreeTime.map((i) => ({
    start: new Date(i[0]).toISOString(),
    end: new Date(i[1]).toISOString(),
  }));

  // Soft conflicts
  const redToRedFreeTime = getMissingIntervals(compulsoryIntervals, now, threeMonthsLater);
  const softConflicts = [];

  for (const gap of redToRedFreeTime) {
    const gapStart = gap[0];
    const gapEnd = gap[1];

    const overlappingFlex = flexibleEvents.filter((f) => f.start < gapEnd && f.end > gapStart);

    if (overlappingFlex.length > 0) {
      for (const flex of overlappingFlex) {
        softConflicts.push({
          start: new Date(gapStart).toISOString(),
          end: new Date(gapEnd).toISOString(),
          label: flex.label,
          title: flex.title || "Untitled",
          ownerName: flex.creator_id,
        });
      }
    }
  }

  return { goodToGo, softConflicts };
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
  newDetails: Partial<
    Pick<UserEvent, "start_time" | "end_time" | "title" | "description">
  >
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

/**
 * Creates recurring events from a base event, based on user's specified frequency.
 *
 * @param base - The base event set to recur.
 * @param until - The end date for the recurrence range, set by the user.
 * @returns An array of UserEvent instances, one for each recurrence.
 */
export function generateRecurringEvents(
  base: UserEvent,
  until: string
): UserEvent[] {
  const events: UserEvent[] = [];
  let start = new Date(Date.parse(base.start_time!));
  let end = new Date(Date.parse(base.end_time!));
  const limit = new Date(until);

  while (start <= limit) {
    events.push({
      ...base,
      start_time: new Date(
        start.getTime() - start.getTimezoneOffset() * 60000
      ).toISOString(),
      end_time: new Date(
        end.getTime() - end.getTimezoneOffset() * 60000
      ).toISOString(),
    });

    const nextStart = new Date(start);
    const nextEnd = new Date(end);

    if (base.recurrence === "weekly") {
      nextStart.setDate(nextStart.getDate() + 7);
      nextEnd.setDate(nextEnd.getDate() + 7);
      start.setDate(start.getDate() + 7);
      end.setDate(end.getDate() + 7);
    } else if (base.recurrence === "monthly") {
      nextStart.setMonth(nextStart.getMonth() + 1);
      nextEnd.setMonth(nextEnd.getMonth() + 1);
    } else if (base.recurrence === "annually") {
      nextStart.setFullYear(nextStart.getFullYear() + 1);
      nextEnd.setFullYear(nextEnd.getFullYear() + 1);
    } else {
      break;
    }

    start = nextStart;
    end = nextEnd;
  }

  return events;
}

/**
 * Checks available timings for a recurring event based on recurrence type and range.
 *
 * @param userIds - list of user IDs on attendee list to check availability for
 * @param baseStart - starting datetime (e.g. 2025-07-15T10:00)
 * @param durationMinutes - duration of each event instance
 * @param repeatUntil - ISO date (e.g. 2025-07-15)
 * @param recurrence - recurrence type ("weekly", "monthly", or "annually")
 * @returns true if all slots are free for everyone on the attendee list, false otherwise
 */
export async function getRecurringTimings({
  userIds,
  baseStart,
  durationMinutes,
  repeatUntil,
  recurrence,
  userMap,
}: {
  userIds: string[];
  baseStart: string;
  durationMinutes: number;
  repeatUntil: string;
  recurrence: "weekly" | "monthly" | "annually";
  userMap: Record<string, string>;
}) {
  if (!baseStart || !durationMinutes || !repeatUntil) {
    return { conflict: false };
  }

  const start = new Date(baseStart);
  const until = new Date(repeatUntil);

  const allInstances: [Date, Date][] = [];

  let current = new Date(start);
  while (current <= until) {
    const instanceStart = new Date(current);
    const instanceEnd = new Date(
      current.getTime() + durationMinutes * 60 * 1000
    );
    allInstances.push([instanceStart, instanceEnd]);

    if (recurrence === "weekly") {
      current.setDate(current.getDate() + 7);
    } else if (recurrence === "monthly") {
      current.setMonth(current.getMonth() + 1);
    } else if (recurrence === "annually") {
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  for (const userId of userIds) {
    const events = await getEvents(userId);

    for (const [recStart, recEnd] of allInstances) {
      const conflict = events.find((e) => {
        if (!e.start_time || !e.end_time) return false;
        if (e.label === "flexible" || e.label === "optional") return false;
        const evStart = new Date(e.start_time);
        const evEnd = new Date(e.end_time);
        return recStart < evEnd && recEnd > evStart;
      });

      if (conflict) {
        const start = new Date(conflict.start_time!).toLocaleString();
        const end = new Date(conflict.end_time!).toLocaleString();
        const isSelf = userId === conflict.creator_id;

        const title = conflict.title || "Untitled Event";

        return {
          conflict: true,
          message: `Conflict with ${title} (${start} - ${end}) for ${
            userMap[userId] || "an attendee"
          }`,
        };
      }
    }
  }

  return { conflict: false };
}

/**
 * Deletes all events in a recurrence group i.e. deletes all events instances of a recurring event.
 *
 * @param groupId - Recurrence group id of event group to be deleted.
 */
export async function deleteRecurringGroup(groupId: string) {
  if (!groupId || groupId === "undefined") {
    throw new Error("Invalid recurrence group ID.");
  }

  const { error } = await supabase
    .from("event")
    .delete()
    .eq("recurrence_group_id", groupId);

  if (error) {
    console.error("Failed to delete recurring event group:", error.message);
    throw error;
  }
}

/**
 * Updates all events in a recurrence group i.e. updates all event instances of a recurring event.
 *
 * @param groupId - Recurrence group id of event group to be updated.
 * @param updatedFields - Updated information of the event.
 */
export async function updateRecurringGroup(
  groupId: string,
  updatedFields: Partial<UserEvent>
) {
  const { error } = await supabase
    .from("event")
    .update(updatedFields)
    .eq("recurrence_group_id", groupId);

  if (error) {
    console.error("Failed to update recurring event group:", error.message);
    throw error;
  }
}

/**
 * Finalises a pending recurring event by generating all future instances
 * based on the chosen start and end time.
 * Deletes the base placeholder event and inserts the full recurring series of finalised events.
 *
 * @param baseEvent - The original placeholder event with recurrence information but no set timing.
 * @param finalisedStart - The confirmed start time to apply to all instances.
 * @param finalisedEnd - The confirmed end time to apply to all instances.
 * @returns An object with optional `error` key if something goes wrong.
 */
export const finalisePendingRecurringEvent = async (
  currentEvent: EventData,
  finalisedStart: string,
  finalisedEnd: string
) => {
  if (!currentEvent.recurrence || !currentEvent.repeat_until) {
    return { error: "Missing recurrence information." };
  }

  const base: UserEvent = {
    title: currentEvent.title,
    description: currentEvent.description ?? undefined,
    start_time: finalisedStart,
    end_time: finalisedEnd,
    recurrence: currentEvent.recurrence,
    recurrence_group_id: currentEvent.recurrence_group_id ?? undefined,
    repeat_until: currentEvent.repeat_until,
    group_id: currentEvent.group_id ?? undefined,
    label: currentEvent.label ?? "compulsory",
  };

  try {
    const events = generateRecurringEvents(base, currentEvent.repeat_until);

    if (currentEvent.recurrence_group_id) {
      await deleteRecurringGroup(currentEvent.recurrence_group_id);
    } else {
      await deleteEvent(currentEvent.id);
    }

    await addEvents(events);

    return {};
  } catch (err) {
    console.error("Failed to finalise recurring event:", err);
    return { error: "Something went wrong while finalising recurring event." };
  }
};

/**
 * Submits a vote for a given timing option on behalf of the user.
 * If the user already voted for the timing, the duplicate vote is silently ignored.
 * 
 * @param userId - the ID of the user voting.
 * @param timingId - the ID of the event_poll_timing option the user is voting for.
 */
export async function submitVote(userId: string, timingId: string) {
  const { data: timingRow, error: timingErr } = await supabase
  .from("event_poll_timing")
  .select("event_id")
  .eq("id", timingId)
  .single();

  if (timingErr || !timingRow) {
    console.error("Failed to get event ID for timing:", timingErr?.message);
    throw new Error("Could not determine event for vote.");
  }

  const eventId = timingRow.event_id;

  const { data: timingIds, error: pollErr } = await supabase
  .from("event_poll_timing")
  .select("id")
  .eq("event_id", eventId);

  if (pollErr) {
    console.error("Failed to fetch timing options for event:", pollErr.message);
    throw new Error("Could not get timing options.");
  }

  const allTimingIds = timingIds.map((t) => t.id);

  const { error: removeError } = await supabase
  .from("event_poll_vote")
  .delete()
  .eq("user_id", userId)
  .in("timing_id", allTimingIds);

  if (removeError) {
    console.error("Failed to remove previous vote(s);", removeError.message);
    throw removeError;
  }

  const { error } = await supabase
  .from("event_poll_vote")
  .insert({ user_id: userId, timing_id: timingId });

  if (error && error.code !== "23505") {
    console.error("Vote submission failed!", error.message);
    throw error;
  }

  if (error?.code === "23505") {
    alert("You’ve already voted for this timing.");
  }
}

/**
 * Fetches all poll timings associated with an event.
 * 
 * @param eventId - ID of the event
 * @returns list of timing options users can vote for.
 */
export async function getPollTimings(eventId: string) {
  const { data, error } = await supabase
  .from("event_poll_timing")
  .select("id, start_time, end_time")
  .eq("event_id", eventId);

  if (error) {
    console.error("Fetching poll timings failed:", error.message);
    throw error;
  }

  return data;
}

/**
 * Fetches all votes for all timings in a given event's poll.
 * 
 * @param eventId - ID of the event
 * @returns list of vote records (user_id, timing_id)
 */
export async function getPollVotes(eventId: string) {
  const { data, error } = await supabase
  .from("event_poll_vote")
  .select("timing_id, user_id, event_poll_timing!inner(event_id)")
  .eq("event_poll_timing.event_id", eventId);

  if (error) {
    console.error("Fetching poll votes failed:", error.message);
    throw error;
  }

  return data;
}

/**
 * Creates an event_poll entry if the event has multiple attendees and is a pending event.
 * @param eventId - ID of the event.
 * @param attendeeCount - Number of attendees (including creator).
 */
export async function createPollIfNeeded(eventId: string, attendeeCount: number): Promise<void> {
  if (attendeeCount > 1) {
    const { error } = await supabase.from("event_poll").insert([{ event_id: eventId }]);
    if (error) throw error;
  }
}

/**
 * Finalises the poll by choosing the most-voted timing.
 * If there is a tie, the earliest timing is selected.
 * @param eventId - ID of the event whose poll is being finalised.
 */
export async function finalisePoll(eventId: string): Promise<void> {
  const timings = await getPollTimings(eventId);
  const votes = await getPollVotes(eventId);

  const voteCounts: Record<string, number> = {};
  for (const vote of votes) {
    voteCounts[vote.timing_id] = (voteCounts[vote.timing_id] || 0) + 1;
  }

  const sorted = timings.sort((a, b) => {
    const vA = voteCounts[a.id] || 0;
    const vB = voteCounts[b.id] || 0;
    if (vA !== vB) return vB - vA;
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  const top = sorted[0];
  if (!top) return;

  const { data: creator, error } = await supabase
    .from("event")
    .select("creator_id")
    .eq("id", eventId)
    .single();

  if (error || !creator) {
    console.error("Failed to confirm event:", error.message);
    throw new Error("Failed to confirm event, please try again later.");
  }

  await finaliseEvent(creator!.creator_id, eventId, {
    start_time: top.start_time,
    end_time: top.end_time,
  });

  const { error: deleteError } = await supabase
  .from("event_poll_timing")
  .delete()
  .eq("event_id", eventId);

  if (deleteError) {
    console.error("Failed to delete poll options after finalising:", deleteError.message);
    throw new Error("Poll finalised but failed to clean up poll options.");
  }
}

/**
 * Checks if all attendees have voted, or if the poll deadline is passed or manually closed.
 * If so, finalises the poll automatically.
 * @param eventId - ID of the event to check.
 */
export async function checkPollCompletion(eventId: string): Promise<void> {
  const attendees = await getAttendees(eventId);
  const votes = await getPollVotes(eventId);
  const pollVoters = new Set(votes.map((v) => v.user_id));

  const allVoted = attendees.length > 1 && attendees.every((a) => pollVoters.has(a.id));

  const { data: poll } = await supabase
    .from("event_poll")
    .select()
    .eq("event_id", eventId)
    .maybeSingle();

  const deadlinePassed = poll?.deadline && new Date(poll.deadline) < new Date();

  if (poll?.closed || allVoted || deadlinePassed) {
    await finalisePoll(eventId);
  }
}

/**Adds a timing option to the poll for an event.
 * Only the event creator can do this.
 * 
 * @param eventId - ID of the event
 * @param start_time - ISO start time
 * @param end_time - ISO end time
 */
export async function addPollOption(
  eventId: string,
  start_time: string,
  end_time: string
) {
  const { data: existing, error: checkError } = await supabase
  .from("event_poll_timing")
  .select("id")
  .eq("event_id", eventId)
  .eq("start_time", start_time)
  .eq("end_time", end_time)
  .maybeSingle();

  if (checkError) {
    console.error("Failed to check for duplicates:", checkError.message);
  }

  if (existing) {
    throw new Error("This timing has already been added as a poll option.");
  }

  const { error } = await supabase
  .from("event_poll_timing")
  .insert([
    { 
      event_id: eventId,
      start_time,
      end_time,
    },
  ]);

 if (error) {
  console.error("Failed to add poll option:", error.message);
  throw new Error(error.message || "Failed to add poll option.");
}

}

/**
 * Removes a vote submitted by the current user for a poll option.
 * This allows users to revoke their vote before the poll is finalised.
 * 
 * @param userId - The ID of the user revoking their vote.
 * @param timingId - the ID of the poll timing option they previously vored for.
 */
export async function removeVote(userId: string, timingId: string) {
  const { error } = await supabase
  .from("event_poll_vote")
  .delete()
  .eq("user_id", userId)
  .eq("timing_id", timingId);

  if (error) {
    console.error("Failed to remove vote:", error.message);
    throw new Error("Failed to remove vote.");
  }
}

/**
 * Deletes a poll timing option from an event's poll.
 * Only the event creator is allowed to perform this action.
 *
 * @param timingId - The ID of the timing option to be deleted.
 */
export async function deletePollTiming(timingId: string) {
  const { error } = await supabase
    .from("event_poll_timing")
    .delete()
    .eq("id", timingId);

  if (error) {
    console.error("Failed to delete poll timing:", error.message);
    throw new Error("Failed to delete poll option.");
  }
}