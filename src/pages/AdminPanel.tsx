import { useState, useEffect } from "react";
import { fetchData, addData } from "../api/backend";

type TabKey = "teachers" | "subjects" | "rooms" | "branches";

interface FieldDef {
  key: string;
  label: string;
  type?: "select" | "text";
  options?: string[];
}

export default function AdminPanel() {
  const [tab, setTab] = useState<TabKey>("teachers");
  const [form, setForm] = useState<Record<string, any>>({});
  const [data, setData] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);

  // Fetch initial data
  useEffect(() => {
    (async () => {
      const branchList = await fetchData("branches");
      setBranches(branchList || []);
    })();
  }, []);

  // Input fields per tab
  const inputFields: Record<TabKey, FieldDef[]> = {
    teachers: [
      { key: "name", label: "Teacher Name" },
      { key: "short", label: "Short Code" },
    ],
    subjects: [
      { key: "name", label: "Subject Name" },
      { key: "code", label: "Subject Code" },
    ],
    rooms: [
      { key: "name", label: "Room / Lab Name" },
      {
        key: "type",
        label: "Type (CLASS/LAB)",
        type: "select",
        options: ["CLASS", "LAB"],
      },
    ],
    branches: [{ key: "name", label: "Branch Name" }],
  };

  // Load table data
  const loadData = async () => {
    const rows = await fetchData(tab);
    setData(rows);
  };

  useEffect(() => {
    setForm({});
    setEditId(null);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Submit handler
  const handleSubmit = async () => {
    if (Object.keys(form).length === 0) {
      alert("⚠️ Please fill out all fields!");
      return;
    }

    try {
      if (editId !== null) {
        // local update only
        const updated = data.map((d) =>
          d.id === editId ? { ...d, ...form } : d
        );
        setData(updated);
        alert("✅ Updated successfully!");
        setEditId(null);
      } else {
        await addData(tab, form);
        alert("✅ Added successfully!");
      }

      await loadData();
      setForm({});
    } catch (err) {
      console.error(err);
      alert("❌ Error saving data.");
    }
  };

  // Edit entry
  const handleEdit = (row: any) => {
    setForm(row);
    setEditId(row.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete entry
  const handleDelete = async (id: number) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/${tab}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      alert("🗑️ Entry deleted!");
      await loadData();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete entry.");
    }
  };

  // Table headers
  const headerKeys: string[] =
    data.length > 0
      ? Object.keys(data[0]).filter((k) => k !== "id")
      : inputFields[tab].map((f) => f.key);

  const headerLabels: Record<string, string> = inputFields[tab].reduce(
    (acc, f) => {
      acc[f.key] = f.label;
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center">🛠️ Admin Data Panel</h2>

      {/* Tabs */}
      <div className="flex justify-center flex-wrap gap-2 mb-4">
        {(["teachers", "subjects", "rooms", "branches"] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md font-medium ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {inputFields[tab].map((f) =>
          f.type === "select" ? (
            <select
              key={f.key}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">-- {f.label} --</option>
              {f.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
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

      {/* Buttons */}
      <div className="flex justify-between mb-6">
        <button
          onClick={handleSubmit}
          className={`${
            editId !== null ? "bg-yellow-600" : "bg-green-600"
          } text-white px-4 py-2 rounded-md`}
        >
          {editId !== null ? "💾 Save Changes" : "➕ Add Entry"}
        </button>
        <button
          onClick={loadData}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-gray-100">
            <tr>
              {headerKeys.map((k) => (
                <th key={k} className="border p-2 text-left capitalize">
                  {headerLabels[k] || k}
                </th>
              ))}
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row) => (
                <tr key={row.id ?? JSON.stringify(row)}>
                  {headerKeys.map((k) => (
                    <td key={k} className="border p-2">
                      {String(row[k] ?? "")}
                    </td>
                  ))}
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleEdit(row)}
                      className="bg-yellow-400 text-black px-2 py-1 rounded mr-2 hover:bg-yellow-500"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="border p-3 text-center text-gray-500"
                  colSpan={headerKeys.length + 1}
                >
                  No entries yet. Add something above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
