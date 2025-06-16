import supabase from '../config/supabaseClient';

//fetching user 
async function getUser() {
    const { 
        data: { user},
        error
    } = await supabase.auth.getUser();

    if (!user || error) {
        console.error("User not signed in.")
        //return null instead of throwing an error because users can still use app without signing in
        return null;
    }

    return user;
}

//fetching events for specific user(for displaying, usage etc)
async function getEvents(userID) {
    const { data, error } = await supabase
    .from('User Calendars')
    .select('*')
    .eq('user_id', userID);

    if (error) {
        console.error("Failed to fetch events:", error);
        throw new Error(error.message);
    }

    return data;
}


//adding events
async function addEvent(eventData) {
    const { data, error } = await supabase
    .from('User Calendars')
    .insert([eventData]);

    if (error) {
        //technical error for supabase, dev console etc
        console.error("Failed to add event:", error);
        //user-friendly error for React
        throw new Error(error.message);
    }

    //supabase automatically returns new row created, different from delete and update
    return data;
}

//deleting events, use ID instead of name because might have same names for two different events e.g. Band Practice
async function deleteEvent(eventID) {
    const { data, error } = await supabase
    .from('User Calendars')
    .delete()
    .eq('id', eventID);

    if (error) {
        console.error("Failed to delete event:", error);
        throw new Error(error.message);
    }
}

async function updateEvent(eventID, updatedData) {
    const { data, error } = await supabase
    .from('User Calendars')
    .update(updatedData)
    .eq('id', eventID);

    if (error) {
        console.error("Failed to update event:", error);
        throw new Error(error.message);
    }
}

export default calendarService;