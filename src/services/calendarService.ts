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

export type UserEvent = Omit<EventData, "id" | "creator_id" | "group_id">;

export type GroupEvent = Omit<EventData, "id" | "creator_id">;

/**
 * Fetches events accessible by the user
 *
 * @returns list of event data
 */
export const getEvents = async (): Promise<EventData[]> => {
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
export const getEvent = async (eventId: string): Promise<EventData> => {
  const { data, error } = await supabase
    .from("event")
    .select()
    .eq("id", eventId);

  if (error) {
    console.error("Failed to fetch event:", error.message);
    throw error;
  }

  return data[0];
};

/**
 * Adds an event created by the user
 *
 * @param event
 */
export const addEvent = async (event: UserEvent) => {
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
export const deleteEvent = async (eventId: string) => {
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
export const updateEvent = async (eventId: string, updatedEvent: UserEvent) => {
  const { error } = await supabase
    .from("event")
    .update(updatedEvent)
    .eq("id", eventId);

  if (error) {
    console.error("Failed to update event:", error.message);
    throw error;
  }
};
