import { supabase } from "../config/supabaseClient";

/**
 * Updates the user's account with a new username and/or display name
 * 
 * @param userId 
 * @param updatedInfo
 */
export const updateAccount = async (
    userId: string, 
    updatedInfo: { username?: string; display_name?: string }
) => {
    const { error } = await supabase
    .from('user')
    .update(updatedInfo)
    .eq('id', userId);

    if (error) throw error;
};

/**
 * Deletes the user's account
 * 
 * @param userId 
 * @returns 
 */
export const deleteAccount = async (userId: string) => {
    const { data, error } = await supabase
    .from('user')
    .delete()
    .eq('id', userId);

    if (error) throw error;
    return data;
};




