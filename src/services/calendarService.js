import supabase from '../config/supabaseClient';

export async function addEvent(eventData) {
    const { data, error } = await supabase
    .from('User Calendars')
    .insert([eventData]);

    if (error) {
        //technical error for supabase, dev console etc
        console.error("Failed to add event:", error);
        //user-friendly error for React
        throw new Error(error.message);
    }

    return data;
}