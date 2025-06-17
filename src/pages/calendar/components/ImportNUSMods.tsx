import React from "react";

const ImportNUSMods = () => {
  return <div>ImportNUSMods</div>;
};

export default ImportNUSMods;

// import React, { useState } from "react";

// function ImportNUSMods() {
//   const [url, setUrl] = useState("");
//   const [schedule, setSchedule] = useState([]);
//   const [error, setError] = useState("");

//   //function to output classes user is taking in the form of a dict
//   function getMods(url: string) {
//     try {
//       //basically extracts everything after the ? in the url i.e. the classes
//       const params = new URL(url).searchParams;
//       const mods = {};
//       //mod = for example, CS2030S, class = LEC:x, TUT:y
//       for (const [mod, classes] of params.entries()) {
//         //splits each class at the comma,
//         const lessons = classes.split(",").map((lesson) => {
//           //splits each LEC:x into LEC, x where x is group number
//           const [type, group] = lesson.split(":");
//           return { type, group };
//         });
//         //so at the end of each for-loop iteration, a new key-value pair is added to mods,
//         // with the key being the mod and the value being the lessons
//         mods[mod] = lessons;
//       }
//       return mods;
//     } catch {
//       //just handle the error later on
//       return null;
//     }
//   }

//   //function to use the dict obtained from getMods to filter and obtain the timetable from
//   async function fetchSchedule(mods) {
//     //update as needed
//     const year = "2024-2025";
//     const sem = 2;

//     let timetable = [];

//     //fetch data based on the names of the mods e.g. CS2030S
//     for (const mod of Object.keys(mods)) {
//       const response = await fetch(
//         `https://api.nusmods.com/v2/${year}/modules/${mod}.json`
//       );

//       if (!response.ok) {
//         setError(`No such data for ${mod}`);
//         return;
//       }

//       const modInfo = await response.json();

//       //find the info pertaining to the mods for the correct sem
//       const semData = modInfo.semesterData.find((s) => s.semester === sem);

//       //if module not offered for the sem, e.g. if link is from a
//       //previous AY, just skip
//       if (!semData) {
//         setError(
//           "Invalid link from a previous sem - this sem does not offer these mods"
//         );
//         return;
//       }

//       //filter the data in the timetable to only return lessons that
//       //contain some class that the user attends
//       const filteredForClasses = semData.timetable.filter((lesson) =>
//         mods[mod].some(
//           (cls) =>
//             cls.type === lesson.lessonType.slice(0, 3).toUpperCase() &&
//             cls.group === lesson.classNo
//         )
//       );

//       filteredForClasses.forEach((cls) => (cls.mod = mod));

//       timetable = timetable.concat(filteredForClasses);
//     }

//     setSchedule(timetable);
//   }

//   const handleImport = async () => {
//     setError(null);
//     const mods = getMods(url);
//     if (!mods) {
//       setError("Invalid NUSMods Timetable");
//       return;
//     }
//     await fetchSchedule(mods);
//   };

//   return (
//     <div>
//       <h3>Sync with NUSMods</h3>
//       <input
//         type="text"
//         placeholder="Paste your NUSMods timetable share URL here"
//         value={url}
//         onChange={(e) => setUrl(e.target.value)}
//       />
//       <button onClick={handleImport}>Import Timetable</button>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       {/* Imported classes should ultimately be added to the calendar.
//       To be implemented for next milestones */}
//     </div>
//   );
// }

// export default ImportNUSMods;
