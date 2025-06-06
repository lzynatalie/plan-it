import React from "react";
import { addEvent } from "../services/calendarService";

function CalendarPage() {
    const handleAddEvent = async () => {
        //eventData is a dict with the event info 
        const eventData = {
            // for now just placeholder text
            user_id: "some id",
            title: "some title",
            start_time: "some time",
            end_time: "some time"
        };

        try {
            const event = await addEvent(eventData);
            console.log("Event created:", event);
        } catch (e) {
            console.error(e.message);
        }
    };

    return (
        //TODO: will fix and pretty up asking user for event later on
        <div>
            <h2> Your Plan-It!</h2>
            <button onClick={handleAddEvent}>Add Event</button>
        </div>
    )
}

export default CalendarPage;