import axios from "axios";

// ✅ Central API base URL
const API_URL = "http://localhost:5000/api";

// ✅ Generic data fetcher (for any table)
export const fetchData = async (table: string) => {
  try {
    const res = await axios.get(`${API_URL}/${table}`);
    return res.data;
  } catch (err) {
    console.error(`❌ Error fetching data from ${table}:`, err);
    return [];
  }
};

// ✅ Generic data adder (for any table)
export const addData = async (table: string, payload: Record<string, any>) => {
  try {
    const res = await axios.post(`${API_URL}/${table}`, payload);
    return res.data;
  } catch (err) {
    console.error(`❌ Error adding data to ${table}:`, err);
    throw err;
  }
};

// ✅ Generic data deleter (for any table)
export const deleteData = async (table: string, id: number | string) => {
  try {
    const res = await axios.delete(`${API_URL}/${table}/${id}`);
    return res.data;
  } catch (err) {
    console.error(`❌ Error deleting from ${table}:`, err);
    throw err;
  }
};

// ✅ Save timetable to backend
export const saveTimetableToDB = async (
  branch: string,
  semesterType: string,
  data: any
) => {
  try {
    const res = await axios.post(`${API_URL}/timetable`, {
      branch,
      semesterType,
      data,
    });
    return res.data;
  } catch (err) {
    console.error("❌ Error saving timetable:", err);
    throw err;
  }
};

// ✅ Load timetable from backend
export const loadTimetableFromDB = async (
  branch: string,
  semesterType: string
) => {
  try {
    const res = await axios.get(`${API_URL}/timetable/${branch}/${semesterType}`);
    return res.data?.data || null;
  } catch (err) {
    console.error("❌ Error loading timetable:", err);
    return null;
  }
};
