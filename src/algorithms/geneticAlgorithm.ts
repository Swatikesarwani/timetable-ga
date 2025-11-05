// src/algorithms/geneticAlgorithm.ts
import {
  DAYS,
  PERIODS,
  TEACHERS,
  SUBJECTS,
  ROOMS,
  COURSES,
} from "../data/timetableData";

/**
 * Gene = one scheduled class (subject + teacher + room + day + period)
 */
export interface Gene {
  courseId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  day: string;
  period: number;
}

export interface Individual {
  genes: Gene[];
  fitness: number;
}

// helper randomizers
const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (max: number) => Math.floor(Math.random() * max);

/**
 * Step 1 – Create a random schedule (initial population)
 */
export function createRandomIndividual(): Individual {
  const genes: Gene[] = [];

  for (const course of COURSES) {
    for (const subject of SUBJECTS) {
      const teacher = rand(TEACHERS);
      const room = subject.isLab
        ? ROOMS.find((r) => r.type === "LAB")!
        : ROOMS.find((r) => r.type === "CLASS")!;
      const day = rand(DAYS);
      const period = randomInt(PERIODS);
      genes.push({
        courseId: course.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        roomId: room.id,
        day,
        period,
      });
    }
  }

  const individual: Individual = { genes, fitness: 0 };
  individual.fitness = calculateFitness(individual);
  return individual;
}

/**
 * Step 2 – Fitness function (lower = better)
 */
export function calculateFitness(ind: Individual): number {
  let penalty = 0;

  // ---------------- HARD CONSTRAINTS ----------------
  // (1) Teacher & room clashes – no teacher or room can repeat same time slot
  for (const day of DAYS) {
    for (let p = 0; p < PERIODS; p++) {
      const sameTime = ind.genes.filter(
        (g) => g.day === day && g.period === p
      );
      const teacherSet = new Set<string>();
      const roomSet = new Set<string>();

      for (const g of sameTime) {
        // teacher clash
        if (teacherSet.has(g.teacherId)) penalty += 1000;
        else teacherSet.add(g.teacherId);

        // room clash
        if (roomSet.has(g.roomId)) penalty += 800;
        else roomSet.add(g.roomId);
      }
    }
  }

  // (2) Subject repetition – avoid same subject twice/day for a course
  const subjectsPerDay: Record<string, Record<string, string[]>> = {};
  for (const g of ind.genes) {
    subjectsPerDay[g.courseId] = subjectsPerDay[g.courseId] || {};
    subjectsPerDay[g.courseId][g.day] =
      subjectsPerDay[g.courseId][g.day] || [];
    subjectsPerDay[g.courseId][g.day].push(g.subjectId);
  }

  for (const courseDays of Object.values(subjectsPerDay)) {
    for (const subjectList of Object.values(courseDays)) {
      const dup = subjectList.length - new Set(subjectList).size;
      if (dup > 0) penalty += dup * 50;
    }
  }

  // ---------------- SOFT CONSTRAINTS ----------------
  // (3) Encourage variety — more unique subjects per course
  for (const course of COURSES) {
    const subjects = ind.genes
      .filter((g) => g.courseId === course.id)
      .map((g) => g.subjectId);
    const unique = new Set(subjects).size;
    const coverage = SUBJECTS.length - unique;
    penalty += coverage * 10;
  }

  // (4) Labs should happen mid-day, not first/last period
  for (const g of ind.genes) {
    const subj = SUBJECTS.find((s) => s.id === g.subjectId);
    if (subj?.isLab && (g.period === 0 || g.period >= PERIODS - 2)) {
      penalty += 20; // early or late lab = slight penalty
    }
  }

  return penalty;
}

/**
 * Step 3 – Mutation (randomly shift class timing)
 */
export function mutate(ind: Individual, rate = 0.1): Individual {
  const mutated = structuredClone(ind) as Individual;
  for (let i = 0; i < mutated.genes.length; i++) {
    if (Math.random() < rate) {
      const g = mutated.genes[i];
      g.day = rand(DAYS);
      g.period = randomInt(PERIODS);
    }
  }
  mutated.fitness = calculateFitness(mutated);
  return mutated;
}

/**
 * Step 4 – Crossover (mix genes from two parents)
 */
export function crossover(a: Individual, b: Individual): Individual {
  const child: Individual = { genes: [], fitness: 0 };
  for (let i = 0; i < a.genes.length; i++) {
    child.genes.push(Math.random() < 0.5 ? a.genes[i] : b.genes[i]);
  }
  child.fitness = calculateFitness(child);
  return child;
}

/**
 * Step 5 – Main GA loop
 */
export function runGA(
  popSize = 30,
  generations = 100,
  mutationRate = 0.1
): Individual {
  let population: Individual[] = Array.from({ length: popSize }, () =>
    createRandomIndividual()
  );
  population.sort((a, b) => a.fitness - b.fitness);
  let best = population[0];

  for (let g = 0; g < generations; g++) {
    const nextGen: Individual[] = [];
    while (nextGen.length < popSize) {
      const parent1 = population[Math.floor(Math.random() * popSize)];
      const parent2 = population[Math.floor(Math.random() * popSize)];
      let child = crossover(parent1, parent2);
      child = mutate(child, mutationRate);
      nextGen.push(child);
    }
    population = nextGen.sort((a, b) => a.fitness - b.fitness);
    if (population[0].fitness < best.fitness) best = population[0];
  }

  return best;
}
