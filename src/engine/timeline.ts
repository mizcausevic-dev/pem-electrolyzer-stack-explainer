export const FPS = 30;
export const TOTAL_FRAMES = 1020;
export const LAST_FRAME = TOTAL_FRAMES - 1;
export const DURATION_S = TOTAL_FRAMES / FPS;

export interface Chapter {
  id: number;
  title: string;
  start: number;
  end: number;
  /** Caption beats: [startFrame, text]. Rich-text markup (see render/text.ts); mirrored in the HTML transcript. */
  beats: [number, string][];
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'Reveal MEA & plates',
    start: 0,
    end: 149,
    beats: [
      [0, 'A PEM stack repeats one cell many times, clamped between two end plates.'],
      [36, 'Section A–A cuts through the flow channels. Nothing is taken apart.'],
      [96, 'Each cell: bipolar plates, porous transport layers, and a catalyst-coated membrane.'],
    ],
  },
  {
    id: 2,
    title: 'Water feed',
    start: 150,
    end: 299,
    beats: [
      [150, 'Deionized water enters through the anode inlet manifold.'],
      [192, 'The manifold feeds every cell’s anode channel in parallel.'],
      [248, 'Water spreads through the porous transport layer to the anode catalyst.'],
    ],
  },
  {
    id: 3,
    title: 'Gas evolution',
    start: 300,
    end: 509,
    beats: [
      [300, 'DC voltage across the cell supplies the energy to split water.'],
      [352, 'At the anode catalyst, water splits into O_2, protons, and electrons.'],
      [392, 'Protons cross the membrane. Electrons take the external circuit. They recombine as H_2.'],
      [440, 'Bubbles detach and ride the channels to the outlet manifolds.'],
    ],
  },
  {
    id: 4,
    title: 'Cooling',
    start: 510,
    end: 749,
    beats: [
      [510, 'Cell losses appear as heat, concentrated in the membrane electrode assembly.'],
      [580, 'Most of the water is not consumed. It circulates and carries the heat out.'],
      [660, 'Outside the stack, a heat exchanger rejects that heat and the cooled water returns.'],
    ],
  },
  {
    id: 5,
    title: 'Balance of plant',
    start: 750,
    end: 1019,
    beats: [
      [750, 'The stack is one block in a larger system: the balance of plant.'],
      [790, 'Power: AC is transformed and rectified to DC for the stack.'],
      [826, 'Water: filtered, deionized, circulated, and separated from O_2.'],
      [872, 'Hydrogen: separated from water, dried, then delivered.'],
      [912, 'Sensors and controls close the loop.'],
      [956, 'Complete system view. Generic PEM, simplified for explanation.'],
    ],
  },
];

export function chapterAt(f: number): Chapter {
  return CHAPTERS.find((c) => f >= c.start && f <= c.end) ?? CHAPTERS[CHAPTERS.length - 1];
}

export function beatAt(f: number): { chapter: Chapter; text: string; since: number } {
  const chapter = chapterAt(f);
  let text = chapter.beats[0][1];
  let since = chapter.beats[0][0];
  for (const [start, t] of chapter.beats) {
    if (f >= start) {
      text = t;
      since = start;
    }
  }
  return { chapter, text, since };
}

export function timecode(f: number): string {
  const s = f / FPS;
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${String(m).padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}`;
}
