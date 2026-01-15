import { useState, useEffect, useRef } from "react";
import TimetableGrid from "./components/TimetableGrid";
import { fetchData } from "./api/backend";
import { DAYS as ALL_DAYS, PERIOD_TIMINGS } from "./data/timetableData";
import type { Timetable } from "./components/TimetableGrid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Row = { subject: string; teacher: string; branch: string };

export default function App() {
  const [branches, setBranches] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState("Final Year");

  const [rows, setRows] = useState<Row[]>([{ subject: "", teacher: "", branch: "" }]);
  const [branchTimetables, setBranchTimetables] = useState<Record<string, Timetable>>({});
  const [teacherTimetables, setTeacherTimetables] = useState<Record<string, Timetable>>({});
  const [roomTimetables, setRoomTimetables] = useState<Record<string, Timetable>>({});
  const [loading, setLoading] = useState(false);
  const [editable, setEditable] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  // Exclude Saturday
  const DAYS = ALL_DAYS.filter((d) => d !== "Saturday");

  useEffect(() => {
    (async () => {
      const [branchData, roomData, teacherData, subjectData] = await Promise.all([
        fetchData("branches"),
        fetchData("rooms"),
        fetchData("teachers"),
        fetchData("subjects"),
      ]);

      setBranches(branchData || []);
      setRooms((roomData || []).filter((r: any) => r.type === "CLASS"));
      setLabs((roomData || []).filter((r: any) => r.type === "LAB"));
      setTeachers(teacherData || []);
      setSubjects(subjectData || []);
    })();
  }, []);

  const toInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .join(".") + ".";

  const isLabSubject = (nameOrCode: string) => /lab/i.test(nameOrCode);

  const addRow = () => setRows((r) => [...r, { subject: "", teacher: "", branch: "" }]);

  const updateRow = (index: number, key: keyof Row, value: string) => {
    const next = [...rows];
    next[index] = { ...next[index], [key]: value };
    setRows(next);
  };

  const handleBranchSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setSelectedBranches(selected);
  };

  const handleRoomsSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setSelectedRooms(selected);
  };

  const handleLabsSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setSelectedLabs(selected);
  };

  const lunchIndex = PERIOD_TIMINGS.findIndex((t) => /lunch/i.test(t));
  const periodCount = PERIOD_TIMINGS.length;

  // Helper to create an empty timetable object for a set of days and periods
  const makeEmptyTimetable = (): Timetable => {
    const table: Timetable = {};
    for (const d of DAYS) {
      table[d] = {};
      for (let p = 0; p < periodCount; p++) table[d][p] = null;
    }
    return table;
  };

  // Helper: add entry to teacher/lab timetable
  const addToTimetable = (
    store: Record<string, Timetable>,
    name: string,
    day: string,
    period: number,
    cell: any
  ) => {
    if (!store[name]) store[name] = makeEmptyTimetable();
    store[name][day][period] = cell;
  };

  // ✅ Generate Timetable for Each Selected Branch
  const handleGenerate = () => {
    const validRows = rows.filter((r) => r.subject && r.teacher && r.branch);
    if (validRows.length === 0 || selectedBranches.length === 0) {
      alert("⚠ Please add subject–teacher–branch entries and select branches!");
      return;
    }

    setLoading(true);

    const useRooms = selectedRooms.length > 0 ? selectedRooms : rooms.map((r) => r.name);
    const useLabs = selectedLabs.length > 0 ? selectedLabs : labs.map((l) => l.name);

    const subjByName: Record<string, any> = {};
    subjects.forEach((s) => (subjByName[s.name] = s));
    const teacherByName: Record<string, any> = {};
    teachers.forEach((t) => (teacherByName[t.name] = t));

    const branchResults: Record<string, Timetable> = {};
    const teacherResults: Record<string, Timetable> = {};
    const roomResults: Record<string, Timetable> = {};

    selectedBranches.forEach((branchName) => {
      const table: Timetable = makeEmptyTimetable();

      const branchSubjects = validRows.filter((r) => r.branch === branchName);
      let roomPtr = 0;
      let labPtr = 0;

      // randomly place each subject entry across the week ensuring no lunch collisions.
      branchSubjects.forEach((item) => {
        const subj = subjByName[item.subject];
        const teach = teacherByName[item.teacher];
        const subjectShort = subj?.code || toInitials(item.subject);
        const teacherShort = teach?.short || toInitials(item.teacher);
        const subjectFull = subj?.name || item.subject;
        const teacherFull = teach?.name || item.teacher;
        const needsLab = isLabSubject(subjectFull) || isLabSubject(subjectShort);

        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 200) {
          const randomDay = DAYS[Math.floor(Math.random() * DAYS.length)];
          const randomPeriod = Math.floor(Math.random() * periodCount);
          attempts++;

          if (randomPeriod === lunchIndex) continue;

          if (needsLab) {
            const next = randomPeriod + 1;
            if (
              next < periodCount &&
              next !== lunchIndex &&
              !table[randomDay][randomPeriod] &&
              !table[randomDay][next]
            ) {
              const roomName = useLabs[labPtr % useLabs.length] || "LAB";
              labPtr++;
              const cell = {
                subjectShort,
                teacherShort,
                roomName,
                subjectName: subjectFull,
                teacherName: teacherFull,
              };
              table[randomDay][randomPeriod] = cell;
              table[randomDay][next] = cell;
              placed = true;

              addToTimetable(teacherResults, teacherFull, randomDay, randomPeriod, cell);
              addToTimetable(roomResults, roomName, randomDay, randomPeriod, cell);
            }
          } else {
            if (!table[randomDay][randomPeriod]) {
              const roomName = useRooms[roomPtr % useRooms.length] || "101";
              roomPtr++;
              const cell = {
                subjectShort,
                teacherShort,
                roomName,
                subjectName: subjectFull,
                teacherName: teacherFull,
              };
              table[randomDay][randomPeriod] = cell;
              placed = true;

              addToTimetable(teacherResults, teacherFull, randomDay, randomPeriod, cell);
              addToTimetable(roomResults, roomName, randomDay, randomPeriod, cell);
            }
          }
        }
      });

      branchResults[branchName] = table;
    });

    setBranchTimetables(branchResults);
    setTeacherTimetables(teacherResults);
    setRoomTimetables(roomResults);
    setLoading(false);
  };

  // Combined PDF export
  const handleDownloadPDF = async () => {
    const input = pdfRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save("Complete_Timetable_Set.pdf");
  };

  // onUpdate handlers that merge day's new data into the correct store
  const handleBranchDayUpdate = (branchName: string, day: string, newDayData: Record<number, any>) => {
    setBranchTimetables((prev) => ({
      ...prev,
      [branchName]: {
        ...prev[branchName],
        [day]: newDayData,
      },
    }));
  };

  const handleTeacherDayUpdate = (teacherName: string, day: string, newDayData: Record<number, any>) => {
    setTeacherTimetables((prev) => ({
      ...prev,
      [teacherName]: {
        ...prev[teacherName],
        [day]: newDayData,
      },
    }));
  };

  const handleRoomDayUpdate = (roomName: string, day: string, newDayData: Record<number, any>) => {
    setRoomTimetables((prev) => ({
      ...prev,
      [roomName]: {
        ...prev[roomName],
        [day]: newDayData,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black relative">
      <h1 className="text-3xl font-bold text-center mb-8 flex justify-center gap-2 items-center">
        <span>📅</span> Smart Timetable Generator (Branches + Teachers + Labs)
      </h1>

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6 mb-10">
        {/* Selection Panels */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="font-semibold">Branches (Select multiple):</label>
            <select multiple className="w-full border p-2 rounded mt-2" onChange={handleBranchSelection}>
              {branches.map((b) => (
                <option key={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">Year:</label>
            <select
              className="w-full border p-2 rounded mt-2"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option>First Year</option>
              <option>Second Year</option>
              <option>Third Year</option>
              <option>Final Year</option>
            </select>
          </div>

          <div>
            <label className="font-semibold">Rooms:</label>
            <select multiple className="w-full border p-2 rounded mt-2" onChange={handleRoomsSelection}>
              {rooms.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">Labs:</label>
            <select multiple className="w-full border p-2 rounded mt-2" onChange={handleLabsSelection}>
              {labs.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rows */}
        <h2 className="text-xl font-semibold text-center mb-4">Subjects & Teachers</h2>

        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-3 mb-3">
            <select
              className="border p-2 rounded"
              value={row.subject}
              onChange={(e) => updateRow(idx, "subject", e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={row.teacher}
              onChange={(e) => updateRow(idx, "teacher", e.target.value)}
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={row.branch}
              onChange={(e) => updateRow(idx, "branch", e.target.value)}
            >
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={addRow} className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600">
            ➕ Add Subject
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`px-6 py-2 rounded-md shadow font-semibold ${
              loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? "Generating..." : "🚀 Generate Timetables"}
          </button>

          {Object.keys(branchTimetables).length > 0 && (
            <>
              <button
                onClick={() => setEditable((prev) => !prev)}
                className="bg-orange-500 text-white px-5 py-2 rounded-md hover:bg-orange-600"
              >
                {editable ? "✅ Save Changes" : "✏ Enable Manual Changes"}
              </button>

              <button
                onClick={handleDownloadPDF}
                className="bg-red-500 text-white px-5 py-2 rounded-md hover:bg-red-600"
              >
                📄 Download All as PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* All Timetables (Branch + Teacher + Room) */}
      <div ref={pdfRef}>
        {/* Branch Timetables */}
        {Object.keys(branchTimetables).length > 0 && (
          <>
            {Object.entries(branchTimetables).map(([branchName, data]) => (
              <div key={branchName} className="mb-12">
                <h3 className="text-center text-2xl font-bold mb-4 text-blue-700">
                  🏫 {branchName} - Student Timetable
                </h3>
                <TimetableGrid
                  title={branchName}
                  data={data}
                  editable={editable}
                  onUpdate={(day, newDay) => handleBranchDayUpdate(branchName, day, newDay)}
                />
              </div>
            ))}

            {/* Teachers Timetables */}
            <hr className="my-8 border-t-4 border-gray-700" />
            <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">👩‍🏫 Teachers Timetables</h2>
            {Object.entries(teacherTimetables).map(([teacher, data]) => (
              <div key={teacher} className="mb-10">
                <h3 className="text-xl font-semibold text-center mb-3">{teacher}</h3>
                <TimetableGrid
                  title={teacher}
                  data={data}
                  editable={editable}
                  onUpdate={(day, newDay) => handleTeacherDayUpdate(teacher, day, newDay)}
                />
              </div>
            ))}

            {/* Labs/Rooms Timetables */}
            <hr className="my-8 border-t-4 border-gray-700" />
            <h2 className="text-2xl font-bold text-center mb-6 text-green-700">🧪 Labs / Rooms Timetables</h2>
            {Object.entries(roomTimetables).map(([room, data]) => (
              <div key={room} className="mb-10">
                <h3 className="text-xl font-semibold text-center mb-3">{room}</h3>
                <TimetableGrid
                  title={room}
                  data={data}
                  editable={editable}
                  onUpdate={(day, newDay) => handleRoomDayUpdate(room, day, newDay)}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
