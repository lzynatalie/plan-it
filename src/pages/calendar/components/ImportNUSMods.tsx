import React, { useState } from "react";
import { addEvents, UserEvent } from "../../../services/calendarService";

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

const sem2Dates: {
  [week: number]: number;
} = {
  1: new Date(2025, 0, 13).getTime(),
  2: new Date(2025, 0, 20).getTime(),
  3: new Date(2025, 0, 27).getTime(),
  4: new Date(2025, 1, 3).getTime(),
  5: new Date(2025, 1, 10).getTime(),
  6: new Date(2025, 1, 17).getTime(),
  7: new Date(2025, 2, 3).getTime(),
  8: new Date(2025, 2, 10).getTime(),
  9: new Date(2025, 2, 17).getTime(),
  10: new Date(2025, 2, 24).getTime(),
  11: new Date(2025, 2, 31).getTime(),
  12: new Date(2025, 3, 7).getTime(),
  13: new Date(2025, 3, 14).getTime(),
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

type ImportNUSModsProps = {
  functions: {
    setImportTimetable: React.Dispatch<React.SetStateAction<boolean>>;
  };
};

const ImportNUSMods = ({
  functions: { setImportTimetable },
}: ImportNUSModsProps) => {
  const [url, setUrl] = useState("");
  const [timetable, setTimetable] = useState<UserEvent[]>([]);
  const [error, setError] = useState("");

  const getMods = (url: string) => {
    const params = new URL(url).searchParams;
    const mods: { code: string; lessons: { type: string; group: string }[] }[] =
      [];

    // code = e.g. CS2030S, classes = LEC:x,TUT:y
    params.forEach((classes, code) => {
      const lessons = classes.split(",").map((lesson) => {
        const [type, group] = lesson.split(":");
        return { type, group };
      });

      mods.push({ code: code, lessons: lessons });
    });

    return mods;
  };

  const getLessons = (code: string, c: RawLesson) => {
    const lessons: UserEvent[] = [];

    const daysOffset = days[c.day as Day] * 24 * 60 * 60 * 1000;
    const startHoursOffset = Number(c.startTime.slice(0, 2)) * 60 * 60 * 1000;
    const endHoursOffset = Number(c.endTime.slice(0, 2)) * 60 * 60 * 1000;
    const timezoneOffset = 8 * 60 * 60 * 1000;

    if (Array.isArray(c.weeks) || c.weeks.weeks) {
      let weeks: number[] = [];

      if (Array.isArray(c.weeks)) {
        weeks = c.weeks;
      } else if (c.weeks.weeks) {
        weeks = c.weeks.weeks;
      }

      for (const week of weeks) {
        const weekStart = sem2Dates[week];

        lessons.push({
          title: `${code} ${c.lessonType}`,
          description: `Group: ${c.classNo}`,

          start_time: new Date(
            weekStart + daysOffset + startHoursOffset + timezoneOffset
          ).toISOString(),

          end_time: new Date(
            weekStart + daysOffset + endHoursOffset + timezoneOffset
          ).toISOString(),
        });
      }

      return lessons;
    } else {
      const weekInterval = c.weeks.weekInterval || 1;
      const startHoursOffset = Number(c.startTime.slice(0, 2)) * 60 * 60 * 1000;
      const endHoursOffset = Number(c.endTime.slice(0, 2)) * 60 * 60 * 1000;

      for (let week = 0; (week += weekInterval); week < 13) {
        const daysOffset = c.weeks.start + week * 7 * 24 * 60 * 60 * 1000;

        lessons.push({
          title: `${code} ${c.lessonType}`,
          description: `Group: ${c.classNo}`,
          start_time: new Date(
            c.weeks.start + daysOffset + startHoursOffset + timezoneOffset
          ).toISOString(),
          end_time: new Date(
            c.weeks.start + daysOffset + endHoursOffset + timezoneOffset
          ).toISOString(),
        });
      }

      return lessons;
    }
  };

  const fetchSchedule = async (
    mods: { code: string; lessons: { type: string; group: string }[] }[]
  ) => {
    // update as needed
    const year = "2024-2025";
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
            l.type === c.lessonType.slice(0, 3).toUpperCase() &&
            l.group === c.classNo
        )
      );

      filteredClasses.forEach((c) => {
        const lessons = getLessons(mod.code, c);
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
        });
      }
    }

    setTimetable(timetable);

    await addEvents(timetable);
  };

  const handleImport = async () => {
    setError("");
    const mods = getMods(url);
    if (!mods) {
      setError("Invalid NUSMods Timetable");
      return;
    }
    await fetchSchedule(mods);
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
        <button onClick={handleImport}>Import Timetable</button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ImportNUSMods;
