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

export async function getGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from("group").select();

  if (error) {
    console.error("Failed to fetch groups:", error.message);
    throw error;
  }

  return data;
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
    .select(`user(id, username)`)
    .eq("group_id", groupId);

  if (error) {
    console.error("Failed to get members:", error.message);
    throw error;
  }

  const memberships = data as unknown as {
    user: { id: string; username: string };
  }[];

  return memberships.map((membership) => membership.user);
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
    .insert({ user_id: memberId, group_id: groupId, role: role });

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
