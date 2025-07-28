import { supabase } from "../config/supabaseClient";
import { EventData } from "./calendarService";

export type Group = {
  id: string;
  creator_id: string;
  name: string;
};

export type Membership = {
  user_id: string;
  group_id: string;
  role: string;
};

export async function getGroups(userId: string): Promise<Group[]> {
  const { data: memberships, error } = await supabase
  .from("user_group")
  .select("group_id")
  .eq("user_id", userId)
  .eq("status", "accepted");

  if (error) {
    console.error("Failed to fetch groups:", error.message);
    throw error;
  }

  const groupIds = memberships.map((row) => row.group_id);

  const { data: groups, error: groupError } = await supabase
  .from("group")
  .select("*")
  .in("id", groupIds);

  if (groupError) {
    console.error("Failed to fetch group data:", groupError.message);
    throw groupError;
  }

  return groups;
}

export async function getGroup(groupId: string): Promise<Group> {
  const { data, error } = await supabase
    .from("group")
    .select()
    .eq("id", groupId)
    .single();

  if (error) {
    console.error("Failed to fetch group:", error.message);
    throw error;
  }

  return data;
}

export async function createGroup(
  groupName: string,
  creatorId: string,
  memberIds: string[]
): Promise<string> {
  if (!memberIds || !memberIds.length) {
    throw new Error("Cannot create group with only one member.");
  }

  const { data, error } = await supabase
    .from("group")
    .insert({ name: groupName })
    .select()
    .single();

  if (error) {
    console.error("Failed to create group:", error.message);
    throw error;
  }

  const groupId = data.id;

  await addMember(creatorId, groupId, "creator");
  await addMembers(memberIds, groupId);

  return groupId;
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from("group").delete().eq("id", groupId);

  if (error) {
    console.error("Failed to delete group:", error.message);
    throw error;
  }
}

export async function getMembers(groupId: string) {
  const { data, error } = await supabase
    .from("user_group")
    .select(`user(id, username), status`)
    .eq("group_id", groupId)
    .eq("status", "accepted");

  if (error) {
    console.error("Failed to get members:", error.message);
    throw error;
  }

  const memberships = data as unknown as {
    user: { id: string; username: string };
    status: string;
  }[];

  return memberships.map((membership) => ({
    ...membership.user,
    status: membership.status,
  }));
}

/**
 * Add users to a group
 *
 * @param memberIds
 * @param groupId
 */
export async function addMembers(memberIds: string[], groupId: string) {
  const members = memberIds.map((memberId) => ({
    user_id: memberId,
    group_id: groupId,
    role: "member",
    status: "invited", 
  }));

  const { error } = await supabase.from("user_group").insert(members);

  if (error) {
    console.error("Failed to add members:", error.message);
    throw error;
  }
}

/**
 * Adds a user to a group as a role
 *
 * If no role is provided, user is added as a member
 *
 * @param memberId
 * @param groupId
 * @param role
 */
export async function addMember(
  memberId: string,
  groupId: string,
  role?: string
) {
  const { error } = await supabase
    .from("user_group")
    .insert({
      user_id: memberId,
      group_id: groupId,
      role: role || "member",
      status: "accepted",
    });

  if (error) {
    console.error("Failed to add member:", error.message);
    throw error;
  }
}

/**
 * Removes a member from a group
 *
 * @param memberId
 * @param groupId
 */
export async function removeMember(memberId: string, groupId: string) {
  const { data: groupEvents, error: eventError } = await supabase
    .from("event")
    .select("id")
    .eq("group_id", groupId);

  if (eventError) {
    console.error("Failed to fetch group events:", eventError.message);
    throw eventError;
  }

  const eventIds = groupEvents.map((event) => event.id);

  if (eventIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("user_event")
      .delete()
      .in("event_id", eventIds)
      .eq("user_id", memberId);

    if (deleteError) {
      console.error(
        "Failed to remove user from group events:",
        deleteError.message
      );
      throw deleteError;
    }
  }

  const { error } = await supabase
    .from("user_group")
    .delete()
    .eq("user_id", memberId)
    .eq("group_id", groupId);

  if (error) {
    console.error("Failed to remove member:", error.message);
    throw error;
  }
}

/**
 * Fetches events of a group
 *
 * @returns list of event data
 */
export async function getGroupEvents(groupId: string): Promise<EventData[]> {
  const { data, error } = await supabase
    .from("event")
    .select()
    .eq("group_id", groupId);

  if (error) {
    console.error("Failed to fetch group events:", error.message);
    throw error;
  }

  return data;
}

export async function getSharedGroups(userIds: string[]): Promise<Group[]> {
  const { data, error } = await supabase
    .from("user_group")
    .select(`group_id`)
    .in("user_id", userIds);

  if (error) {
    console.error("Failed to fetch shared groups:", error.message);
    throw error;
  }

  const groupIds: string[] = data.map(({ group_id }) => group_id);

  const groupCount = new Map<string, number>();

  for (const groupId of groupIds) {
    groupCount.set(groupId, (groupCount.get(groupId) || 0) + 1);
  }

  const sharedGroupIds = Array.from(groupCount.entries())
    .filter(([_, count]) => count === userIds.length)
    .map(([groupId]) => groupId);

  const { data: groups, error: groupError } = await supabase
    .from("group")
    .select()
    .in("id", sharedGroupIds);

  if (groupError) {
    console.error("Failed to fetch shared groups:", groupError.message);
    throw groupError;
  }

  return groups;
}

/**
 * Updates the name of a group in the database.
 * 
 * @param groupId - The ID of the group to update.
 * @param name - The new name to assign to the group.
 */
export const updateGroupName = async (groupId: string, name: string) => {
  const { error } = await supabase
    .from("group")
    .update({ name })
    .eq("id", groupId);

  if (error) throw error;
};

/**
 * Fetches all group invitations for a user (status = 'invited').
 * 
 * @param userId - The user ID to fetch group invites for.
 * @returns Array of group data the user is invited to.
 */
export async function getGroupInvites(userId: string): Promise<Group[]> {
  const { data: userGroupRows, error } = await supabase
    .from("user_group")
    .select("group_id")
    .eq("user_id", userId)
    .eq("status", "invited");

  if (error) {
    console.error("Failed to fetch group invites:", error.message);
    throw error;
  }

  const groupIds = userGroupRows.map((row) => row.group_id);

  const { data: groups, error: groupError } = await supabase
    .from("group")
    .select("id, name, creator_id")
    .in("id", groupIds);

  if (groupError) {
    console.error("Failed to fetch group data:", groupError.message);
    throw groupError;
  }

  return groups;
}


/**
 * Updates a group invitation status (e.g. accepted, declined).
 * 
 * @param userId - The invited user.
 * @param groupId - The group ID.
 * @param status - New status: 'accepted' or 'declined'.
 */
export async function respondToGroupInvite(
  userId: string,
  groupId: string,
  status: "accepted" | "declined"
) {
  const { error } = await supabase
    .from("user_group")
    .update({ status })
    .eq("user_id", userId)
    .eq("group_id", groupId);

    if (error) {
    console.error("Failed to update group invite status:", error.message);
    throw error;
  } else {
    console.log(`✅ Invite updated: ${status} for group ${groupId}`);
  }
}
