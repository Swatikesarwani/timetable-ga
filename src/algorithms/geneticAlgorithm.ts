import { DAYS, PERIOD_TIMINGS } from "../data/timetableData";

// -------------------- Types --------------------
export interface Gene {
  courseId: string;  // branch ID
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

export interface Teacher {
  id: string;
  name: string;
  short?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  isLab?: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: "CLASS" | "LAB";
}

export interface Branch {
  id: string;
  name: string;
}

// -------------------- Utility Helpers --------------------
const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (max: number) => Math.floor(Math.random() * max);

// -------------------- Create Random Individual --------------------
export function createRandomIndividual(
  teachers: Teacher[],
  subjects: Subject[],
  rooms: Room[],
  branches: Branch[]
): Individual {
  const genes: Gene[] = [];

  for (const branch of branches) {
    for (const subject of subjects) {
      const teacher = rand(teachers);
      const room = subject.isLab
        ? rand(rooms.filter((r) => r.type === "LAB"))
        : rand(rooms.filter((r) => r.type === "CLASS"));
      const day = rand(DAYS);
      const period = randomInt(PERIOD_TIMINGS.length);

      genes.push({
        courseId: branch.id,
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

// -------------------- Fitness Function --------------------
export function calculateFitness(ind: Individual): number {
  let penalty = 0;

  // Penalize teacher or room clashes
  for (const day of DAYS) {
    for (let p = 0; p < PERIOD_TIMINGS.length; p++) {
      const sameTime = ind.genes.filter((g) => g.day === day && g.period === p);
      const teacherSet = new Set<string>();
      const roomSet = new Set<string>();

      for (const g of sameTime) {
        if (teacherSet.has(g.teacherId)) penalty += 1000; // teacher clash
        else teacherSet.add(g.teacherId);

        if (roomSet.has(g.roomId)) penalty += 800; // room clash
        else roomSet.add(g.roomId);
      }
    }
  }

  // Avoid repeating same subject twice per day for same branch
  const subjectsPerDay: Record<string, Record<string, string[]>> = {};
  for (const g of ind.genes) {
    subjectsPerDay[g.courseId] = subjectsPerDay[g.courseId] || {};
    subjectsPerDay[g.courseId][g.day] = subjectsPerDay[g.courseId][g.day] || [];
    subjectsPerDay[g.courseId][g.day].push(g.subjectId);
  }

  for (const courseDays of Object.values(subjectsPerDay)) {
    for (const subjectList of Object.values(courseDays)) {
      const dup = subjectList.length - new Set(subjectList).size;
      if (dup > 0) penalty += dup * 50;
    }
  }

  return penalty;
}

// -------------------- Mutation --------------------
export function mutate(ind: Individual, rate = 0.1): Individual {
  const mutated = structuredClone(ind) as Individual;
  for (let i = 0; i < mutated.genes.length; i++) {
    if (Math.random() < rate) {
      const g = mutated.genes[i];
      g.day = rand(DAYS);
      g.period = randomInt(PERIOD_TIMINGS.length);
    }
  }
  mutated.fitness = calculateFitness(mutated);
  return mutated;
}

// -------------------- Crossover --------------------
export function crossover(a: Individual, b: Individual): Individual {
  const child: Individual = { genes: [], fitness: 0 };
  for (let i = 0; i < a.genes.length; i++) {
    child.genes.push(Math.random() < 0.5 ? a.genes[i] : b.genes[i]);
  }
  child.fitness = calculateFitness(child);
  return child;
}

// -------------------- Run GA --------------------
export function runGA(
teachers: Teacher[], subjects: Subject[], rooms: Room[], branches: Branch[], p0: never[], popSize = 30, generations = 100, mutationRate = 0.1): Individual {
  if (
    !teachers.length ||
    !subjects.length ||
    !rooms.length ||
    !branches.length
  ) {
    throw new Error("⚠️ Not enough input data for GA!");
  }

  // Create initial population
  let population: Individual[] = Array.from({ length: popSize }, () =>
    createRandomIndividual(teachers, subjects, rooms, branches)
  );

  population.sort((a, b) => a.fitness - b.fitness);
  let best = population[0];

  // Evolve over generations
  for (let g = 0; g < generations; g++) {
    const nextGen: Individual[] = [];

    while (nextGen.length < popSize) {
      const parent1 = rand(population);
      const parent2 = rand(population);
      let child = crossover(parent1, parent2);
      child = mutate(child, mutationRate);
      nextGen.push(child);
    }

    population = nextGen.sort((a, b) => a.fitness - b.fitness);
    if (population[0].fitness < best.fitness) best = population[0];
  }

  return best;
}
