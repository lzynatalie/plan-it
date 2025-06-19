import { supabase } from "../config/supabaseClient";

export type Friend = {
    id: number;
    sender: string;
    recipient: string;
    status: "pending" | "accepted" | "declined";
};

export async function getFriends(userID: string): Promise<Friend[]> {
    const { data, error } = await supabase
    .from("friend")
    .select("*")
    .or(`sender.eq.${userID},recipient.eq.${userID}`)
    .eq("status", "accepted");

    if (error) {
        console.error("Failed to fetch friends:", error.message);
        throw error;
    }

    return data || [];
}

export async function getPendingRequests(userID: string): Promise<Friend[]> {
    const { data, error } = await supabase
    .from("friend")
    .select("*")
    .eq("recipient", userID)
    .eq("status", "pending");

    if (error) {
        console.error("Failed to fetch pending requests:", error.message);
        throw error;
    }

    return data || [];
}

export async function sendFriendRequest(senderID: string, recipientID: string) {
    const { data, error } = await supabase
    .from("friend")
    .select("id")
    .or(`and(sender.eq.${senderID},recipient.eq.${recipientID}).and(sender.eq.${recipientID},recipient.eq.${senderID})`)
    .neq("status", "declined");

    if (error) {
        console.error("Failed to check for existing request:", error.message);
        throw error;
    }

    if (data && data.length > 0) {
        throw new Error("Friend request already exists or is pending.");
    }

    const { error: insertError } = await supabase
    .from("friend")
    .insert([
        { sender: senderID, recipient: recipientID, status: "pending" },
    ]);

    if (insertError) {
        console.error("failed to send friend request:", insertError.message);
        throw insertError;
    }
}

export async function respondToRequest(friendshipID: number, status: "accepted" | "declined") {
    const { error } = await supabase
    .from("friend")
    .update({ status })
    .eq("id", friendshipID);

    if (error) {
        console.error("Failed to respond to friend request:", error.message);
        throw error;
    }
}

export async function getUserIDByUsername(username: string): Promise<string | null> {
    const { data, error } = await supabase
    .from("user")
    .select("id")
    .eq("username", username)
    .single();

    if (error) {
        if (error.code === "PGRST116") {
            // no rows found
            return null;
        }
        console.error("Failed to find user:", error.message);
        throw error;
    }

    return data?.id || null;
}
