import { supabase } from "../config/supabaseClient";

export type EventData = {
  id: string;
  creator_id: string;
  group_id?: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
};

export type UserEvent = Omit<EventData, "id" | "creator_id">;

export type GroupEvent = Omit<EventData, "id" | "creator_id" | "start_time" | "end_time">;

/**
 * Fetches events accessible by the user
 *
 * @returns list of event data
 */
export async function getEvents(): Promise<EventData[]> {
  const { data, error } = await supabase
    .from("event")
    .select()
    .order("start_time");

  if (error) {
    console.error("Failed to fetch events:", error.message);
    throw error;
  }

  return data;
};

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
};

/**
 * Adds an event created by the user
 *
 * @param event
 */
export async function addEvent(event: UserEvent | GroupEvent) {
  const { error } = await supabase.from("event").insert([event]);

  if (error) {
    console.error("Failed to add event:", error.message);
    throw error;
  }
};

/**
 * Deletes an event given its id
 *
 * @param eventId
 */
export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from("event")
    .delete()
    .eq("id", eventId);

  if (error) {
    console.error("Failed to delete event:", error.message);
    throw error;
  }
};

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
};
