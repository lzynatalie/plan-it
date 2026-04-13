import React, { useState } from "react";
import { addEvents, deleteNUSMODsEvents, UserEvent } from "../../../services/calendarService";
import { useAuthContext } from "../../../context/AuthContext";
import { v4 as uuidv4 } from "uuid";

type Module = {
  semesterData: SemesterData[];
};

type SemesterData = {
  semester: number;
  timetable: RawLesson[];
  examDate?: string;
  examDuration?: number;
};

type RawLesson = Readonly<{
  classNo: string; // E.g. "1", "A"
  day: string; // E.g. "Monday", "Tuesday"
  endTime: string; // E.g. "1500"
  lessonType: string; // E.g. "Lecture", "Tutorial"
  startTime: string; // E.g. "1400"
  venue: string;
  weeks: number[] | WeekRange;
  size: number;
}>;

type WeekRange = {
  // The start and end dates
  start: string;
  end: string;
  // Number of weeks between each lesson. If not specified one week is assumed
  // ie. there are lessons every week
  weekInterval?: number;
  // Week numbers for modules with uneven spacing between lessons. The first
  // occurrence is on week 1
  weeks?: number[];
};

type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

const sem1Dates: {
  [week: number]: number;
} = {
  1: new Date(2025, 7, 11).getTime(),  // 11 Aug 2025
  2: new Date(2025, 7, 18).getTime(),
  3: new Date(2025, 7, 25).getTime(),
  4: new Date(2025, 8, 1).getTime(),
  5: new Date(2025, 8, 8).getTime(),
  6: new Date(2025, 8, 15).getTime(),
  7: new Date(2025, 8, 22).getTime(),
  8: new Date(2025, 8, 29).getTime(),
  9: new Date(2025, 9, 6).getTime(),
  10: new Date(2025, 9, 13).getTime(),
  11: new Date(2025, 9, 20).getTime(),
  12: new Date(2025, 9, 27).getTime(),
  13: new Date(2025, 10, 3).getTime(), // 3 Nov 2025
};

const sem2Dates: { [week: number]: number } = {
  1: new Date(2026, 0, 12).getTime(), // Mon 12 Jan 2026
  2: new Date(2026, 0, 19).getTime(),
  3: new Date(2026, 0, 26).getTime(),
  4: new Date(2026, 1, 2).getTime(),
  5: new Date(2026, 1, 9).getTime(),
  6: new Date(2026, 1, 16).getTime(),
  // recess week: 21 Feb – 1 Mar
  7: new Date(2026, 2, 2).getTime(),  // Mon 2 Mar 2026
  8: new Date(2026, 2, 9).getTime(),
  9: new Date(2026, 2, 16).getTime(),
  10: new Date(2026, 2, 23).getTime(),
  11: new Date(2026, 2, 30).getTime(),
  12: new Date(2026, 3, 6).getTime(),
  13: new Date(2026, 3, 13).getTime(), // Mon 13 April 2026
};

const days = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

const lessonTypeMap: Record<string, string> = {
  "Design Lecture": "DLEC",
  "Laboratory": "LAB",
  "Lecture": "LEC",
  "Packaged Lecture": "PLEC",
  "Packaged Tutorial": "PTUT",
  "Recitation": "REC",
  "Sectional Teaching": "SEC",
  "Seminar-Style Module Class": "SEM",
  "Tutorial": "TUT",
  "Tutorial Type 2": "TUT2",
  "Tutorial Type 3": "TUT3",
  "Workshop": "WS",
};

type ImportNUSModsProps = {
  functions: {
    setImportTimetable: React.Dispatch<React.SetStateAction<boolean>>;
    fetchEvents: () => Promise<void>;
  };
};

const ImportNUSMods = ({
  functions: { setImportTimetable, fetchEvents },
}: ImportNUSModsProps) => {
  const { user } = useAuthContext();

  const [url, setUrl] = useState("");
  const [timetable, setTimetable] = useState<UserEvent[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const getMods = (urlString: string) => {
    try {
      const params = new URL(urlString).searchParams;
      const mods: { code: string; lessons: { type: string; group: string }[] }[] = [];

      params.forEach((classes, code) => {
        if (!classes) {
          mods.push({ code, lessons: [] });
          return;
        }

        const lessons: { type: string; group: string }[] = [];

        const parts = classes.split(";");

        parts.forEach((part) => {
          const [type, groupRaw] = part.split(":");
          if (type && groupRaw) {
            // Strip away the parentheses
            const cleanGroup = groupRaw.replace(/[\(\)\[\]]/g, "");

            const individualGroups = cleanGroup.split(",");

            individualGroups.forEach((g) => {
              lessons.push({ type, group: g });
            });
          }
        });

        mods.push({ code, lessons });
      });

      return mods;
    } catch {
      return [];
    }
  };

  const getLessons = (
      code: string,
      c: RawLesson,
      recurrence_group_id: string,
      sem: number): UserEvent[] => {
    const lessons: UserEvent[] = [];

    const daysOffset = days[c.day as Day] * 24 * 60 * 60 * 1000;
    const startHoursOffset = Number(c.startTime.slice(0, 2)) * 60 * 60 * 1000;
    const endHoursOffset = Number(c.endTime.slice(0, 2)) * 60 * 60 * 1000;
    const timezoneOffset = 8 * 60 * 60 * 1000;

    let weeks: number[] = [];

    if (Array.isArray(c.weeks)) {
      weeks = c.weeks;
    } else if (c.weeks.weeks) {
      weeks = c.weeks.weeks;
    }

    for (const week of weeks) {
      const weekStart = sem == 1 ? sem1Dates[week] : sem2Dates[week];

      lessons.push({
        title: `${code} ${c.lessonType}`,
        description: `Group: ${c.classNo}`,

        start_time: new Date(
          weekStart + daysOffset + startHoursOffset + timezoneOffset
        ).toISOString(),

        end_time: new Date(
          weekStart + daysOffset + endHoursOffset + timezoneOffset
        ).toISOString(),

        label: "compulsory",
      });
    }

    return lessons;
  };

  const fetchSchedule = async (
    mods: { code: string; lessons: { type: string; group: string }[] }[]
  ) => {
    // update as needed
    const year = "2025-2026";
    const sem = 2;

    let timetable: UserEvent[] = [];

    // fetch data based on the names of the mods e.g. CS2030S
    for (const mod of mods) {
      const response = await fetch(
        `https://api.nusmods.com/v2/${year}/modules/${mod.code}.json`
      );

      if (!response.ok) {
        setError(`No such data for ${mod.code}`);
        return;
      }

      const modInfo: Module = await response.json();

      // get timetable for correct semester
      const semData = modInfo.semesterData.find((s) => s.semester === sem);

      if (!semData) {
        setError(`Unable to find ${mod.code} in semester ${sem}`);
        return;
      }

      // filter semData to only contain classes that the user is in
      const filteredClasses = semData.timetable.filter((c) =>
          mod.lessons.some(
              (l) =>
                  // Checks the map first to catch the weird NUSMods API names
                  (l.type === lessonTypeMap[c.lessonType] || l.type === c.lessonType.slice(0, 3).toUpperCase()) &&
                  l.group === c.classNo
          )
      );

      filteredClasses.forEach((c) => {
        const recurrence_group_id = uuidv4();
        const lessons = getLessons(mod.code, c, recurrence_group_id, sem);
        timetable = timetable.concat(lessons);
      });

      if (semData.examDate && semData.examDuration) {
        timetable.push({
          title: `${mod.code} Final`,
          start_time: new Date(
            new Date(semData.examDate).getTime() + 8 * 60 * 60 * 1000
          ).toISOString(),
          end_time: new Date(
            new Date(semData.examDate).getTime() +
              semData.examDuration * 60 * 1000 +
              8 * 60 * 60 * 1000
          ).toISOString(),
          label: "compulsory",
        });
      }
    }

    setTimetable(timetable);

    await addEvents(timetable, "nusmods", user!.id);
  };

  const handleImport = async () => {
      const confirm = window.confirm(
        "This action will delete your previously imported NUSMODs timetable. Continue?"
      );

      if (!confirm) return;

    setError("");
    setSuccess(false);
    setLoading(true);

    const mods = getMods(url);
    if (!mods) {
      setError("Invalid NUSMods Timetable");
      setLoading(false);
      return;
    }

    try {
      await deleteNUSMODsEvents(user!.id);
      await fetchSchedule(mods);
      await fetchEvents();
      setSuccess(true);
    } catch (error:any ) {
      console.error("Timetable import failed:", error);
      setError("Failed to import timetable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="box">
      <h2>Import from NUSMods</h2>
      <input
        type="text"
        placeholder="Paste the original (not shortened) link to your NUSMods timetable"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div className="row">
        <button onClick={(e) => setImportTimetable(false)}>Close</button>
        <button onClick={handleImport} disabled={loading}>Import Timetable</button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && (
        <p style={{ color: "green"}}>
          Timetable imported successfully!<br />
          You can change the event priority of any class later from your calendar.
        </p>
      )}
    </div>
  );
};

export default ImportNUSMods;
