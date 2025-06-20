import { supabase } from "../config/supabaseClient";

export type Group = {
  id: string;
  creator_id: string;
  name: string;
};

export async function getGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from("group").select();

  if (error) {
    console.error("Failed to fetch groups:", error.message);
    throw error;
  }

  return data;
}

export async function createGroup(memberIds: string[], groupName: string): Promise<string | undefined> {
  if (memberIds.length === 1) {
    return undefined;
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

  const members = memberIds.map(memberId => ({
    user_id: memberId,
    group_id: data.id,
  }))
  
  const {error: insertError} = await supabase.from("user_group").insert(members);

  if (insertError) {
    console.error("Failed to add members:", insertError.message);
    throw error;
  }

  return data.id;
}
