import { supabase } from "../config/supabaseClient";

export type UserEvent = {
  title: string;
  start_time: string;
  end_time: string;
};

export type UserEventData = UserEvent & {
  id: string;
  user_id: string;
};

/**
 * Fetches events created by the user
 *
 * @returns list of user_event data
 */
export const getEvents = async (userID: string): Promise<UserEventData[]> => {
  const { data, error } = await supabase
    .from("user_event")
    .select()
    .eq("user_id", userID)
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
 * @returns user_event data
 */
export const getEvent = async (eventId: string): Promise<UserEventData> => {
  const { data, error } = await supabase
    .from("user_event")
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
  const { error } = await supabase.from("user_event").insert([event]);

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
    .from("user_event")
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
    .from("user_event")
    .update(updatedEvent)
    .eq("id", eventId);

  if (error) {
    console.error("Failed to update event:", error.message);
    throw error;
  }
};
