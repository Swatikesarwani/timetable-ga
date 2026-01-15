import { useState, useEffect } from "react";
import { addData, fetchData } from "../api/backend";

type TabKey = "teachers" | "subjects" | "rooms" | "branches";

interface FieldDef {
  key: string;
  label: string;
  type?: string;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<TabKey>("teachers");
  const [form, setForm] = useState<Record<string, any>>({});
  const [data, setData] = useState<any[]>([]);

  const inputFields: Record<TabKey, FieldDef[]> = {
    teachers: [
      { key: "name", label: "Teacher Name" },
      { key: "short", label: "Short Code" },
    ],
    subjects: [
      { key: "name", label: "Subject Name" },
      { key: "code", label: "Subject Code" },
      { key: "semesterType", label: "Semester Type (Even/Odd)" },
    ],
    rooms: [
      { key: "name", label: "Room / Lab Name" },
      { key: "type", label: "Type (CLASS/LAB)" },
    ],
    branches: [{ key: "name", label: "Branch Name" }],
  };

  const loadData = async () => {
    const rows = await fetchData(tab);
    setData(rows);
  };

  useEffect(() => {
    setForm({});
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleSubmit = async () => {
    const payload = { ...form };
    await addData(tab, payload);
    await loadData();
    setForm({});
  };

  const headerKeys =
    data.length > 0
      ? Object.keys(data[0]).filter((k) => k !== "id")
      : inputFields[tab].map((f) => f.key);

  const headerLabels: Record<string, string> = inputFields[tab].reduce(
    (acc, f) => ({ ...acc, [f.key]: f.label }),
    {} as Record<string, string>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center">🛠️ Data Management Panel</h2>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        {(["teachers", "subjects", "rooms", "branches"] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md font-medium ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {inputFields[tab].map((f) =>
          f.key === "semesterType" ? (
            <select
              key={f.key}
              value={form[f.key] || ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">-- Select Semester Type --</option>
              <option value="Even">Even</option>
              <option value="Odd">Odd</option>
            </select>
          ) : (
            <input
              key={f.key}
              type="text"
              placeholder={f.label}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="border p-2 rounded"
            />
          )
        )}
      </div>

      <div className="flex justify-between mb-6">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded-md"
        >
          ➕ Add Entry
        </button>
        <button
          onClick={loadData}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-gray-100">
            <tr>
              {headerKeys.map((k) => (
                <th key={k} className="border p-2 text-left capitalize">
                  {headerLabels[k] || k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id ?? JSON.stringify(row)}>
                {headerKeys.map((k) => (
                  <td key={k} className="border p-2">
                    {String(row[k] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  className="border p-3 text-center text-gray-500"
                  colSpan={headerKeys.length}
                >
                  No entries yet. Add above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
