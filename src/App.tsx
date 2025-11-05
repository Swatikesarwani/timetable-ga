import { useState } from "react";
import { runGA } from "./algorithms/geneticAlgorithm";
import TimetableGrid from "./components/TimetableGrid";
import { SUBJECTS, TEACHERS, ROOMS, COURSES } from "./data/timetableData";

export default function App() {
  const [branchTables, setBranchTables] = useState<any>({});
  const [teacherTables, setTeacherTables] = useState<any>({});
  const [labTables, setLabTables] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"branch" | "teacher" | "lab" | null>(null);

  // --------------------- Generate Timetables ---------------------
  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const best = runGA(30, 100, 0.15);

      const branchView: any = {};
      const teacherView: any = {};
      const labView: any = {};

      for (const g of best.genes) {
        const subj = SUBJECTS.find((s) => s.id === g.subjectId);
        const teacher = TEACHERS.find((t) => t.id === g.teacherId);
        const room = ROOMS.find((r) => r.id === g.roomId);
        const course = COURSES.find((c) => c.id === g.courseId);

        const courseKey = `${course?.branch} Sem-${course?.semester} ${course?.section}`;

        // ----- Branch timetable -----
        branchView[courseKey] = branchView[courseKey] || {};
        branchView[courseKey][g.day] = branchView[courseKey][g.day] || {};
        branchView[courseKey][g.day][g.period] = {
          subjectCode: subj?.code || g.subjectId,
          teacherShort: teacher?.short || g.teacherId,
          room: room?.name || g.roomId,
        };

        // ----- Teacher timetable -----
        const tKey = teacher?.short || g.teacherId;
        teacherView[tKey] = teacherView[tKey] || {};
        teacherView[tKey][g.day] = teacherView[tKey][g.day] || {};
        teacherView[tKey][g.day][g.period] = {
          subjectCode: subj?.code || g.subjectId,
          teacherShort: tKey,
          room: room?.name || g.roomId,
        };

        // ----- Lab / Room timetable -----
        const rKey = room?.name || g.roomId;
        labView[rKey] = labView[rKey] || {};
        labView[rKey][g.day] = labView[rKey][g.day] || {};
        labView[rKey][g.day][g.period] = {
          subjectCode: subj?.code || g.subjectId,
          teacherShort: tKey,
          room: rKey,
        };
      }

      setBranchTables(branchView);
      setTeacherTables(teacherView);
      setLabTables(labView);
      setActiveView(null);
      setLoading(false);
    }, 300);
  };

  // --------------------- Utilities ---------------------
  const exportPDF = () => window.print();

  const handleSave = () => {
    const data = { branchTables, teacherTables, labTables };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetables.json";
    a.click();
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = JSON.parse(event.target?.result as string);
      setBranchTables(data.branchTables || {});
      setTeacherTables(data.teacherTables || {});
      setLabTables(data.labTables || {});
      alert("✅ Timetables loaded successfully!");
    };
    reader.readAsText(file);
  };

  // --------------------- UI ---------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <h1 className="text-3xl font-bold text-center mb-6">
        AI Timetable Generator 🧬
      </h1>

      {/* Top Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`px-6 py-2 rounded-md shadow font-semibold ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "Generating..." : "Generate Timetables"}
        </button>

        <button
          onClick={() => setActiveView("branch")}
          className={`px-5 py-2 rounded-md font-medium ${
            activeView === "branch"
              ? "bg-green-600 text-white"
              : "bg-white border border-gray-300 hover:bg-green-50"
          }`}
        >
          🎓 View Branch
        </button>

        <button
          onClick={() => setActiveView("teacher")}
          className={`px-5 py-2 rounded-md font-medium ${
            activeView === "teacher"
              ? "bg-green-600 text-white"
              : "bg-white border border-gray-300 hover:bg-green-50"
          }`}
        >
          👩‍🏫 View Teacher
        </button>

        <button
          onClick={() => setActiveView("lab")}
          className={`px-5 py-2 rounded-md font-medium ${
            activeView === "lab"
              ? "bg-green-600 text-white"
              : "bg-white border border-gray-300 hover:bg-green-50"
          }`}
        >
          🧪 View Labs
        </button>

        <button
          onClick={exportPDF}
          className="px-5 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700"
        >
          Export PDF
        </button>

        <button
          onClick={handleSave}
          className="px-5 py-2 bg-yellow-500 text-white rounded-md font-medium hover:bg-yellow-600"
        >
          💾 Save JSON
        </button>

        <label className="px-5 py-2 bg-teal-600 text-white rounded-md font-medium hover:bg-teal-700 cursor-pointer">
          📂 Load JSON
          <input
            type="file"
            accept=".json"
            onChange={handleLoad}
            className="hidden"
          />
        </label>
      </div>

      {/* Conditional Rendering */}
      {!activeView && (
        <p className="text-center text-gray-600">
          Click <span className="font-semibold">Generate</span> and then choose
          a view to display timetables.
        </p>
      )}

      {activeView === "branch" &&
        Object.entries(branchTables).map(([branch, data]) => (
          <TimetableGrid key={branch} title={`Branch: ${branch}`} data={data as any} />
        ))}

      {activeView === "teacher" &&
        Object.entries(teacherTables).map(([teacher, data]) => (
          <TimetableGrid key={teacher} title={`Teacher: ${teacher}`} data={data as any} />
        ))}

      {activeView === "lab" &&
        Object.entries(labTables).map(([room, data]) => (
          <TimetableGrid key={room} title={`Room: ${room}`} data={data as any} />
        ))}
    </div>
  );
}
