import { supabase } from "../config/supabaseClient";
import { useAuthContext } from "../context/AuthContext";

export type Friendship = {
    id: string;
    sender_id: string;
    recipient_id: string;
    status: "pending" | "accepted" | "declined";
    username?: string;
};

/**
 * Fetches all accepted friendships
 *
 * @returns list of friendships
 */
export async function getFriendships(): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from("friendship")
    .select()
    .eq("status", "accepted");

  if (error) {
    console.error("Failed to fetch friendships:", error.message);
    throw error;
  }

  return data;
}

/**
 * Returns the friend of the user given a friendship
 * 
 * @param userId 
 * @param friendship 
 * @returns friend id
 */
export function getFriend(userId: string, friendship: Friendship): string {
  return userId === friendship.sender_id ? friendship.recipient_id : friendship.sender_id;
} 

/**
 * Fetches the user's incoming friend requests
 * 
 * @param userId 
 * @returns list of friendships
 */
export async function getPendingRequests(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from("friendship")
    .select()
    .eq("recipient_id", userId)
    .eq("status", "pending");

  if (error) {
    console.error("Failed to fetch pending requests:", error.message);
    throw error;
  }

  return data;
}

/**
 * Sends friend request to another user
 * 
 * @param senderId 
 * @param recipientId 
 */
export async function sendFriendRequest(senderId: string, recipientId: string) {
  const { data, error } = await supabase
    .from("friendship")
    .select("id")
    .or(
      `and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`
    )
    .neq("status", "declined");

  if (error) {
    console.error("Failed to check for existing request:", error.message);
    throw error;
  }

  if (data && data.length > 0) {
    throw new Error("Friend request already exists or is pending.");
  }

  const { error: insertError } = await supabase
    .from("friendship")
    .insert([{ sender_id: senderId, recipient_id: recipientId, status: "pending" }]);

  if (insertError) {
    console.error("failed to send friend request:", insertError.message);
    throw insertError;
  }
}

/**
 * Accepts or declines a friend request
 * 
 * @param friendshipId 
 * @param status 
 */
export async function respondToRequest(
  friendshipId: string,
  status: "accepted" | "declined"
) {
  const { error } = await supabase
    .from("friendship")
    .update({ status })
    .eq("id", friendshipId);

  if (error) {
    console.error("Failed to respond to friend request:", error.message);
    throw error;
  }
}

/**
 * Fetches a user's id given their username
 * 
 * @param username 
 * @returns 
 */
export async function getUserId(
  username: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user")
    .select("id")
    .eq("username", username);

  if (error) {
    console.error("Failed to fetch user:", error.message);
    throw error;
  }

  if (!data || !data.length) {
    return null;
  }

  return data[0].id;
}

/**
 * Deletes a friendship
 * 
 * @param friendshipId
 */
export async function deleteFriendship(friendshipId: string): Promise<void> {
    const { error } = await supabase
    .from("friendship")
    .delete()
    .eq("id", friendshipId);

    if (error) {
        console.error("Failed to delete friendship:", error.message);
        throw error;
    }
}