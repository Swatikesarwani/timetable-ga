import React, { useState } from "react";
import { DAYS, PERIOD_TIMINGS, PERIODS } from "../data/timetableData";
import { Lock, Unlock } from "lucide-react";

interface TimetableGridProps {
  title: string;
  data: {
    [day: string]: {
      [period: number]: {
        subjectCode: string;
        teacherShort: string;
        room: string;
      } | null;
    };
  };
}

export default function TimetableGrid({ title, data }: TimetableGridProps) {
  const [lockedCells, setLockedCells] = useState<Record<string, boolean>>({});
  const [dragData, setDragData] = useState<{
    day: string;
    period: number;
  } | null>(null);

  const toggleLock = (day: string, period: number) => {
    const key = `${day}-${period}`;
    setLockedCells((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDragStart = (day: string, period: number) => {
    if (lockedCells[`${day}-${period}`]) return;
    setDragData({ day, period });
  };

  const handleDrop = (targetDay: string, targetPeriod: number) => {
    if (!dragData) return;
    const sourceDay = dragData.day;
    const sourcePeriod = dragData.period;

    // skip locked target
    if (lockedCells[`${targetDay}-${targetPeriod}`]) return;

    // swap
    const temp = data[sourceDay]?.[sourcePeriod];
    data[sourceDay][sourcePeriod] = data[targetDay]?.[targetPeriod] || null;
    data[targetDay][targetPeriod] = temp;

    setDragData(null);
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-3 text-center">{title}</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Day</th>
              {PERIOD_TIMINGS.map((time, idx) => (
                <th
                  key={idx}
                  className={`border border-gray-300 p-1 text-xs w-24 ${
                    time.includes("Lunch") ? "bg-yellow-100" : ""
                  }`}
                >
                  P{idx + 1}
                  <br />
                  <span className="text-[11px] font-normal">{time}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {DAYS.map((day) => (
              <tr key={day}>
                <td className="border border-gray-300 font-semibold p-2 w-16">
                  {day}
                </td>

                {Array.from({ length: PERIODS }).map((_, p) => {
                  const cell = data[day]?.[p];
                  const isLunch = PERIOD_TIMINGS[p].includes("Lunch");
                  const locked = lockedCells[`${day}-${p}`];

                  return (
                    <td
                      key={p}
                      className={`border border-gray-300 text-sm h-16 relative ${
                        isLunch ? "bg-yellow-50 italic" : "bg-white"
                      } ${locked ? "bg-gray-200" : "hover:bg-blue-50"}`}
                      draggable={!isLunch && !locked}
                      onDragStart={() => handleDragStart(day, p)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(day, p)}
                    >
                      {isLunch ? (
                        <div className="text-xs font-semibold">Lunch Break</div>
                      ) : cell ? (
                        <div className="flex flex-col justify-center items-center leading-tight">
                          <span className="font-bold text-[13px]">
                            {cell.subjectCode}
                          </span>
                          <span className="text-[11px] opacity-80">
                            /{cell.teacherShort}
                          </span>
                          <span className="text-[10px] mt-1">{cell.room}</span>
                        </div>
                      ) : (
                        "-"
                      )}

                      {!isLunch && (
                        <button
                          onClick={() => toggleLock(day, p)}
                          className="absolute top-1 right-1 text-gray-500 hover:text-black"
                        >
                          {locked ? (
                            <Lock size={12} className="text-gray-600" />
                          ) : (
                            <Unlock size={12} />
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
