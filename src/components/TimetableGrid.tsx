import React from "react";
import { DAYS, PERIOD_TIMINGS } from "../data/timetableData";

// value imports for runtime components
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
// type-only imports to satisfy TypeScript/verbatimModuleSyntax
import type { DropResult } from "@hello-pangea/dnd";

export interface TimetableCell {
  subjectShort: string;
  teacherShort: string;
  roomName: string;
  subjectName?: string;
  teacherName?: string;
}

export interface Timetable {
  [day: string]: {
    [period: number]: TimetableCell | null;
  };
}

interface TimetableGridProps {
  title: string;
  data: Timetable;
  editable?: boolean;
  onUpdate?: (day: string, newDayData: Record<number, TimetableCell | null>) => void;
}

export default function TimetableGrid({
  title,
  data,
  editable = false,
  onUpdate,
}: TimetableGridProps) {
  // collect used metadata for footer
  const subjectsMap = new Map<string, string>();
  const teachersMap = new Map<string, string>();
  const roomsSet = new Set<string>();

  Object.values(data || {}).forEach((periods) => {
    Object.values(periods).forEach((cell) => {
      if (cell) {
        subjectsMap.set(cell.subjectShort, cell.subjectName || "");
        teachersMap.set(cell.teacherShort, cell.teacherName || "");
        roomsSet.add(cell.roomName);
      }
    });
  });

  // Helper: produce a shallow copy of day object
  const copyDay = (dayData: Record<number, TimetableCell | null>) => {
    return Object.keys(dayData).reduce((acc: Record<number, TimetableCell | null>, k) => {
      acc[Number(k)] = dayData[Number(k)];
      return acc;
    }, {});
  };

  // Check if a cell at index is a 2-slot (lab) block by seeing if next index has same reference/object
  const isTwoSlotAt = (dayData: Record<number, TimetableCell | null>, idx: number) => {
    if (!dayData[idx]) return false;
    const next = dayData[idx + 1];
    return next !== undefined && next !== null && next === dayData[idx];
  };

  // Validate whether a two-slot can be placed at destination
  const canPlaceTwoSlot = (
    destDayData: Record<number, TimetableCell | null>,
    destIdx: number
  ) => {
    // must have destIdx and destIdx+1 inside range and both empty (or same cell if replacing)
    if (destIdx < 0 || destIdx + 1 >= PERIOD_TIMINGS.length) return false;
    const lunchIndex = PERIOD_TIMINGS.findIndex((t) => /lunch/i.test(t));
    if (destIdx === lunchIndex || destIdx + 1 === lunchIndex) return false;
    return !destDayData[destIdx] && !destDayData[destIdx + 1];
  };

  // Move handler for the whole table (supports cross-day moves)
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const srcDay = result.source.droppableId;
    const dstDay = result.destination.droppableId;
    const srcIdx = result.source.index;
    const dstIdx = result.destination.index;

    // shallow copy calendar
    const newData: Timetable = {};
    for (const d of DAYS) {
      newData[d] = copyDay(data[d] || {});
    }

    const srcDayData = newData[srcDay];
    const dstDayData = newData[dstDay];

    // nothing to move
    const movingCell = srcDayData[srcIdx];
    if (!movingCell) return;

    const movingIsTwo = isTwoSlotAt(srcDayData, srcIdx);

    // If moving a two-slot, ensure destination can accept two slots
    if (movingIsTwo) {
      if (!canPlaceTwoSlot(dstDayData, dstIdx)) {
        alert("Cannot place 2-hour lab here (collision or lunch). Choose another slot.");
        return;
      }

      // Clear source two-slot (both indices)
      srcDayData[srcIdx] = null;
      srcDayData[srcIdx + 1] = null;

      // Place into destination as two-slot (same object reference for both indices)
      dstDayData[dstIdx] = movingCell;
      dstDayData[dstIdx + 1] = movingCell;
    } else {
      // single-slot move — ensure destination single slot is free (or allow swap)
      const destOccupant = dstDayData[dstIdx];

      // If destination is occupied by a two-slot (occupant same as occupant+1), we disallow overwrite
      if (dstDayData[dstIdx] && dstDayData[dstIdx + 1] === dstDayData[dstIdx]) {
        alert("Cannot drop onto a 2-hour lab block. Choose an empty slot or swap with a lecture.");
        return;
      }

      // perform move: swap positions (so you can drop onto occupied slot and they swap)
      srcDayData[srcIdx] = destOccupant || null;
      dstDayData[dstIdx] = movingCell;
    }

    // call onUpdate for changed days so parent can persist change
    if (onUpdate) {
      // notify for both srcDay and dstDay if different
      onUpdate(srcDay, srcDayData);
      if (dstDay !== srcDay) onUpdate(dstDay, dstDayData);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-black mb-10">
      <div className="text-center mb-4 border-b border-black pb-2">
        <h1 className="text-2xl font-bold uppercase tracking-wide">USHA MITTAL INSTITUTE OF TECHNOLOGY</h1>
        <h2 className="text-lg font-semibold">SNDT Women’s University, Mumbai</h2>
        <p className="text-sm mt-1">
          Class: {title} | Timings: 8:30 AM – 12:30 PM & 1:15 PM – 5:15 PM
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <table className="w-full text-center text-sm border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-20">Day</th>
              {PERIOD_TIMINGS.map((time, i) => (
                <th key={i} className="border border-black p-2 font-semibold">
                  {time}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {DAYS.filter((d) => d !== "Saturday").map((day) => {
              const dayData = data[day] || {};
              return (
                <Droppable droppableId={day} direction="horizontal" key={day}>
                  {(dropProvided) => (
                    // row wrapper must be a <tr>, but Droppable provides container props for div/fragment.
                    // We let Droppable render a fragment and attach provided.placeholder at end.
                    <tr ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                      <td className="border border-black font-semibold p-2 bg-gray-50">{day}</td>

                      {PERIOD_TIMINGS.map((time, index) => {
                        const isLunch = /lunch/i.test(String(time));
                        const cell = dayData[index];
                        // if this is part of a two-slot lab and it's the second cell, we skip rendering (it is merged)
                        const isSecondOfTwo =
                          cell && dayData[index - 1] && dayData[index - 1] === cell;

                        if (isLunch) {
                          return (
                            <td key={`${day}-lunch-${index}`} className="border border-black bg-yellow-100 font-semibold">
                              🍴 Lunch
                            </td>
                          );
                        }

                        if (isSecondOfTwo) {
                          // placeholder cell already rendered as colspan=2 at previous index
                          return null;
                        }

                        // detect if this index starts a two-slot
                        const startsTwo = cell !== null && dayData[index + 1] === cell;

                        // For Draggable we need a unique draggableId per cell
                        const draggableId = `${day}-${index}`;

                        return (
                          <Draggable
                            key={draggableId}
                            draggableId={draggableId}
                            index={index}
                            isDragDisabled={!editable}
                          >
                            {(dragProvided, dragSnapshot) => {
                              // if startsTwo, render a colspan=2 cell
                              if (startsTwo) {
                                return (
                                  <td
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    colSpan={2}
                                    className={`border border-black bg-green-100 font-semibold align-top ${
                                      dragSnapshot.isDragging ? "opacity-80" : ""
                                    }`}
                                  >
                                    {cell ? (
                                      <>
                                        <div className="font-semibold">{cell.subjectShort}</div>
                                        <div className="text-xs text-gray-700">{cell.teacherShort}</div>
                                        <div className="text-xs italic text-gray-500">{cell.roomName}</div>
                                      </>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                );
                              }

                              // normal single-slot cell
                              return (
                                <td
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={`border border-black p-2 align-top ${
                                    dragSnapshot.isDragging ? "opacity-80 bg-blue-50" : ""
                                  }`}
                                >
                                  {cell ? (
                                    <>
                                      <div className="font-semibold">{cell.subjectShort}</div>
                                      <div className="text-xs text-gray-700">{cell.teacherShort}</div>
                                      <div className="text-xs italic text-gray-500">{cell.roomName}</div>
                                    </>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              );
                            }}
                          </Draggable>
                        );
                      })}

                      {dropProvided.placeholder}
                    </tr>
                  )}
                </Droppable>
              );
            })}
          </tbody>
        </table>
      </DragDropContext>

      <div className="mt-8 text-sm text-left grid grid-cols-3 gap-4">
        <div>
          <h4 className="font-semibold underline mb-1 text-center">Subjects:</h4>
          {[...subjectsMap.entries()].map(([short, full], i) => (
            <p key={i}>
              <span className="font-semibold">{full}</span> – {short}
            </p>
          ))}
        </div>
        <div>
          <h4 className="font-semibold underline mb-1 text-center">Teachers:</h4>
          {[...teachersMap.entries()].map(([short, full], i) => (
            <p key={i}>
              <span className="font-semibold">{full}</span> – {short}
            </p>
          ))}
        </div>
        <div>
          <h4 className="font-semibold underline mb-1 text-center">Classrooms / Labs:</h4>
          {[...roomsSet].map((r, i) => (
            <p key={i}>• {r}</p>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-xs italic">
        Generated automatically using AI-based Timetable Generator © UMIT
      </div>
    </div>
  );
}
