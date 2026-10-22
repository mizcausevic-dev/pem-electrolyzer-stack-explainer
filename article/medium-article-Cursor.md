<!--
PUBLISHING METADATA (not part of the article body)

SEO title (50 chars):      How a PEM Electrolyzer Stack Works, Frame by Frame
Medium title:              How a PEM Electrolyzer Stack Works, Frame by Frame
Subtitle / kicker:         A 34-second, code-built anatomy explainer of membrane, plates, water, gas, heat, and the plant around them, with every claim tied to DOE and NREL sources.
Meta description (156):    See how a PEM electrolyzer stack splits water: membrane, plates, water feed, gas evolution, cooling, and balance of plant, in a 34-second code-built explainer.
Custom slug:               how-pem-electrolyzer-stack-works-frame-by-frame
Medium tags (max 5):       Hydrogen, Electrolysis, Clean Energy, Data Visualization, Typescript
Alternate tags:            Renewable Energy, Engineering, Science Communication, Web Development, Animation
Canonical URL:             leave blank (original to Medium)
Primary query:             how does a PEM electrolyzer work
Secondary queries:         PEM electrolyzer stack components; PEM electrolysis half reactions; PEM electrolyzer balance of plant; MEA vs CCM; PEM electrolyzer cooling
Hero image file:           public/media/pem-electrolyzer-hero-Cursor.png (2400×1260)
Hero image URL:            https://mizcausevic-dev.github.io/pem-electrolyzer-stack-explainer/media/pem-electrolyzer-hero-Cursor.png
Hero alt text:             Section view of a generic PEM electrolyzer stack showing repeating cells, with labels for the outlet manifolds, an anode channel carrying water and oxygen, the proton exchange membrane, and a cathode channel carrying hydrogen.
Hero caption:              Section A–A through a generic PEM stack. Illustrative schematic, not to scale. Rendered from the same code as the explainer.
Social card:               public/media/pem-electrolyzer-og-Cursor.png (1200×630)
Embed:                     Paste the live explainer URL on its own line, or upload the MP4 as a GIF/video if your Medium plan supports it.
-->

# How a PEM Electrolyzer Stack Works, Frame by Frame

### A 34-second, code-built anatomy explainer of membrane, plates, water, gas, heat, and the plant around them, with every claim tied to DOE and NREL sources.

![Section view of a generic PEM electrolyzer stack showing repeating cells, with labels for the outlet manifolds, an anode channel carrying water and oxygen, the proton exchange membrane, and a cathode channel carrying hydrogen.](https://mizcausevic-dev.github.io/pem-electrolyzer-stack-explainer/media/pem-electrolyzer-hero-Cursor.png)
*Section A–A through a generic PEM stack. Illustrative schematic, not to scale. Rendered from the same code as the explainer.*

A proton exchange membrane (PEM) electrolyzer uses DC electricity to split water into hydrogen and oxygen across a thin polymer membrane that lets only protons through. That one sentence is accurate and almost useless for building intuition. Where does the water go? Why are there hundreds of identical cells? Where does the heat come from, and what is all the equipment around the stack doing?

I wanted an explainer that answers those questions in the order a curious engineer would ask them, without inventing a single specification. The result is a 34-second, 1,020-frame anatomy animation of a generic PEM stack, rendered entirely from code.

**Watch it here:** [PEM Electrolyzer Stack Explainer](https://mizcausevic-dev.github.io/pem-electrolyzer-stack-explainer/) (live player with chapters, transcript, and sources). The source is on [GitHub](https://github.com/mizcausevic-dev/pem-electrolyzer-stack-explainer).

The rest of this piece walks through what each chapter shows and why, then opens the hood on how a deterministic, frame-driven timeline keeps a technical animation honest.

---

## The short answer: what a PEM electrolyzer stack is

A PEM electrolyzer stack is a pile of identical cells clamped between two end plates. Each cell has a membrane coated with catalyst on both faces, porous layers that move water and gas to and from that membrane, and plates with flow channels on either side. According to the U.S. Department of Energy, the membrane is a "solid plastic material that only allows hydrogen ions (protons) to pass through it," and PEM electrolyzers "typically operate at relatively low temperatures, about 70°C–90°C" ([DOE HFTO](https://www.energy.gov/eere/fuelcells/hydrogen-production-electrolysis)).

The stack never works alone. It needs power conversion, water treatment, heat rejection, gas separation and drying, and controls. Engineers call that surrounding equipment the balance of plant.

The explainer is structured as five chapters that move from the inside out.

| Chapter | Time | Question it answers |
|---|---|---|
| 1. Reveal MEA and plates | 0:00 to 0:05 | What is inside one cell? |
| 2. Water feed | 0:05 to 0:10 | How does water reach the catalyst? |
| 3. Gas evolution | 0:10 to 0:17 | Where do hydrogen and oxygen form, and how do they leave? |
| 4. Cooling | 0:17 to 0:25 | Where does heat come from, and where does it go? |
| 5. Balance of plant | 0:25 to 0:34 | What does the rest of the system do? |

---

## Chapter 1: Reveal the MEA and plates

The animation opens on the exterior of a generic stack: end plates, tie rods, current collectors, manifold ports, and DC terminals. A section plane labeled A–A then sweeps down through the flow channels. That choice matters. A cutaway shows the interior without implying the stack comes apart that way, which an exploded view of a compressed, sealed assembly would.

The camera dives from stack scale to one repeating cell and names each layer from anode to cathode:

- **Bipolar plate.** Separates neighboring cells and conducts current from one cell to the next.
- **Anode flow channel.** Carries water in and an oxygen and water mixture out.
- **Porous transport layer (PTL).** On the anode side this is typically sintered porous titanium.
- **Anode catalyst layer**, the **membrane**, and the **cathode catalyst layer.** Together these form the catalyst-coated membrane (CCM).
- **Gas diffusion layer (GDL).** On the cathode side this is typically carbon paper.
- **Cathode flow channel.** Carries hydrogen out.

Those material families follow NREL's manufactured cost analyses, which describe repeating cells electrically in series with water and product gas distributed in parallel, a platinum-coated sintered titanium anode PTL, and a carbon paper cathode GDL ([NREL 2019](https://docs.nlr.gov/docs/fy19osti/72740.pdf); [NREL 2024](https://docs.nlr.gov/docs/fy24osti/87625.pdf)).

One terminology trap gets its own label: some sources call the CCM alone the membrane electrode assembly (MEA), and others use MEA for the CCM plus both porous layers. The animation brackets both and marks usage as varying, rather than picking a side and quietly confusing half the audience.

Two honesty badges appear in this chapter: **cell count reduced for clarity** (six cells shown; NREL's 1 MW baseline uses 300) and **not to scale, layers exaggerated**. A membrane drawn at true relative thickness would be invisible at stack scale.

## Chapter 2: Water feed

Deionized water enters through the anode inlet manifold. One manifold feeds every cell's anode channel in parallel, so the animation fills the manifold first and then raises water in each channel with a small, position-dependent delay. That stagger is the visual proof of a parallel feed.

Water then wets the porous transport layer until it reaches the anode catalyst. The cathode channel stays dry, and its label says why: "no liquid feed, in this generic configuration." That qualifier is deliberate. It matches the DOE description of water splitting at the anode, and NREL's baseline connects the water supply subsystem to the oxygen side of the stack. It does not claim every commercial design works this way.

A **flow speed illustrative** badge stays up for the chapter. Real flow rates are not what this sequence is teaching.

## Chapter 3: Gas evolution

DC power switches on, and the camera dives from cell scale to the catalyst interface. This is the one place where the mechanism cannot be shown faithfully as hardware, so the frame changes visual grammar and says so: **schematic, molecular scale** and **slow motion** badges appear, and molecules are drawn as labeled symbols rather than pretend photography.

The sequence follows the DOE's description step by step. At the anode, "direct current (DC) voltage applied to the electrolyzer provides the energy to split water molecules into oxygen molecules, positively charged hydrogen ions (protons), and electrons." The membrane "allows hydrogen ions to pass through it to the cathode, while the electrons flow through an external circuit." At the cathode, hydrogen ions combine with electrons from the external circuit to form hydrogen gas ([DOE HFTO](https://www.energy.gov/eere/fuelcells/hydrogen-production-electrolysis)).

A grid-paper equation panel tracks the step on screen, highlighting each half-reaction as it happens:

```
Anode:    2H₂O  →  O₂ + 4H⁺ + 4e⁻
Cathode:  4H⁺ + 4e⁻  →  2H₂
Net:      2H₂O  →  2H₂ + O₂
```

The stoichiometry gives the one quantitative statement the animation makes: for every four electrons transferred, one oxygen molecule forms at the anode and two hydrogen molecules form at the cathode, a 2 to 1 molar ratio. Back at cell scale, the bubble spawner respects that ratio (about two hydrogen bubbles per oxygen bubble), while a label notes that bubble sizes and counts are schematic.

Oxygen leaves with the excess water through the anode outlet manifold. Hydrogen leaves through its own manifold, drawn with dashed hidden lines because it sits behind the section plane.

## Chapter 4: Cooling

Electrolysis in a real stack is not lossless, and those losses show up as heat concentrated in the membrane electrode assembly. The animation renders that heat as a translucent field (fields get contours, hardware gets solid fills) and marks the sequence **time compressed, thermal build-up**, because a stack does not reach temperature in eight seconds.

The key insight in this chapter is the one most diagrams skip: most of the water flowing through the stack is not consumed. NREL's 2024 analysis notes that water enters the stack at a high flow rate, only "a small portion" of it is split, and the rest is recirculated to the main tank. That unconverted water "gains thermal energy from inherent inefficiencies," and an air-cooled radiator brings it back down before it re-enters the stack ([NREL 2024](https://docs.nlr.gov/docs/fy24osti/87625.pdf)).

So the circulating water does two jobs: reactant and coolant. A qualitative panel plots water temperature rising along one anode channel, inside the DOE's typical 70 to 90 °C band, and shows the energy balance that governs it:

```
Q̇ = ṁ · cₚ · (T_out − T_in)
```

The panel says "no values implied," and it means it. The camera then pulls back to the loop: tank, circulation pump, heat exchanger, a temperature transmitter at the stack outlet, and cooled water returning to the stack.

## Chapter 5: Balance of plant

The final chapter zooms out until the stack becomes one block in a process schematic, then builds the plant around it in causal order, following NREL's balance-of-plant breakdown:

- **Power.** AC supply, transformer and rectifier, DC bus to the stack.
- **Water.** Feed water through a carbon filter and deionizer, into a tank that also separates oxygen from the returning water, with an oxygen vent (or capture).
- **Heat.** Circulation pump and heat exchanger, the same loop from Chapter 4.
- **Hydrogen.** A hydrogen and water separator, a dryer, and hydrogen product leaving for compression, storage, or use, with recovered water routed back (the route is labeled simplified).
- **Controls.** Temperature, pressure, level, and water quality instrumentation feeding a controls and safety logic block.

NREL describes the inlet water treatment as "a carbon filter [that] removes organic contaminants and is followed by a deionization unit," which "ensures that the water supplied does not poison catalysts or other materials in the electrolyzer stack" ([NREL 2024](https://docs.nlr.gov/docs/fy24osti/87625.pdf)). That is why the deionizer appears in the very first caption of Chapter 2.

The animation ends on a stable, complete-system view and holds it for roughly three seconds. An explainer that cuts away on a camera move leaves the viewer with motion; one that holds leaves them with a map.

---

## How the explainer is built

Most technical animation is keyframed by hand in a motion graphics tool. That works until a subject-matter expert asks for a change, and the change ripples through every downstream keyframe. This explainer takes a different approach: **every frame is a pure function of its index.**

```ts
renderFrame(ctx, frame, { scale })  // same frame in, same pixels out
```

No wall-clock time, no `Math.random`, no state carried from the previous frame. A seeded hash generates every "random" position, so bubble placement is identical on every run. I verified this by rendering frames 0, 425, 690, and 1019 in two separate headless browser sessions, in opposite order, and comparing SHA-256 hashes. All four were byte-identical.

That property buys three things a hand-keyframed workflow does not:

1. **Review by frame number.** A reviewer can say "frame 425, the oxygen label is clipped," and anyone can reproduce exactly that image.
2. **Scrubbing and capture use the same code.** The live player and the MP4 encoder call the same function, so the published video cannot drift from the interactive version.
3. **Edits stay local.** Moving a chapter boundary is a change to one number in a timeline file, not a re-timing session.

### One world, one camera

Every scene, from the six-cell exterior down to individual molecules and back out to the full plant, lives in a single world coordinate system. A camera with 19 keyframes moves through it. Two details keep the motion readable.

**Zoom interpolates in log space around a fixed point.** The camera covers more than a 150× range, from the full plant down to the catalyst interface, and a single dive can be 10× or more. Linear interpolation of zoom makes those dives feel like they accelerate at the end, and linear interpolation of the camera center makes the target swing sideways. The fix is to interpolate zoom logarithmically and solve for the center so that the point being zoomed into stays put on screen:

```ts
const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e);
// weight that keeps one world point fixed on screen while zoom changes
const w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, z };
```

**Detail fades in by zoom level.** Pore textures, catalyst particles, and molecules only draw once the camera is close enough to read them, and fade back out on the way up. This is the same level-of-detail idea game engines use, applied to explanation: the viewer never sees detail they cannot resolve.

### Labels that follow the hardware

The explainer uses 57 labels. Each is anchored to a world point (a layer, a manifold, a sensor) or to a moving actor (a specific water molecule, proton group, or bubble), then drawn in screen space with a leader line so text stays a readable size at any zoom. During camera moves, labels fade out as they approach the header, legend, or locator inset, rather than sliding under them. Every collision fix in this project came from rendering a specific frame, looking at it, and adjusting a timing window or offset.

### A visual grammar that separates hardware, fields, and math

The brief asked for clear separation between hardware, fields, and mathematical diagrams. The rule set is short enough to print in the legend:

- **Solid fills are hardware.** Plates, layers, vessels, pumps.
- **Translucent contours are fields.** Heat, flow direction.
- **Grid-paper panels are math.** Equations, the temperature plot, the charge-path schematic.

Color carries meaning, not decoration: cyan for the primary pathway (water, protons, product gas), gold for energy and actuation (DC power, electrons, heat, pumps), violet for sensing and state change. The legend says outright that these are "explanatory overlays, not literal emission."

### Crawlable by default

A canvas animation is invisible to search engines and screen readers. So the chapter titles, caption beats, and source list live in TypeScript, and a small Vite plugin writes them into the static HTML at build time: a full transcript, a chapter list, a sources section, and `VideoObject` structured data with a `Clip` for each chapter. The canvas is the experience. The HTML is the record.

### From frames to MP4

Capture runs headless Chrome through `puppeteer-core`, asks the page for each frame as a PNG, and pipes the stream into `ffmpeg`:

```bash
ffmpeg -f image2pipe -framerate 30 -c:v png -i - \
  -vf scale=out_color_matrix=bt709:out_range=tv,format=yuv420p \
  -c:v libx264 -preset slow -tune animation -crf 18 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -movflags +faststart out.mp4
```

Tagging the output as BT.709 matters for a dark palette. Untagged files often play back with lifted blacks or shifted hues, and a near-black stage like `#0B1019` makes that obvious.

Measured on the build machine: all 1,020 frames rendered and encoded in about 97 seconds, producing a 22.96 MB, 1080p30 H.264 file. The renderer is about 3,300 lines of TypeScript with no runtime dependencies beyond two self-hosted font packages.

The project was built in Cursor with an AI coding agent working from a written production brief, with each visual fix checked against rendered frames.

---

## Accuracy guardrails: what the animation refuses to say

The fastest way to lose a technical audience is one confident wrong number. These constraints held for every frame:

- **Generic PEM only.** No vendor, model, or product is depicted.
- **No efficiency, cost, current density, pressure, or voltage values.** The single quantitative statement is the 2 to 1 molar ratio, which follows from the balanced equations.
- **Every departure from reality is labeled on screen**: not to scale, cell count reduced, schematic molecular scale, slow motion, time compression, flow speed illustrative, simplified process schematic.
- **Sectional views, not impossible disassembly.**
- **No decorative particles.** Every moving dot is a molecule, a charge, a bubble, or a flow marker with a defined meaning.
- **Every on-screen mechanism claim maps to a cited source**, listed at the end of the page and below.

It is also not a certified engineering reference. Treat it as a consolidated working brief: accurate to the sources cited, simplified on purpose, and worth checking against those sources before you reuse it in training or sales material.

## What I would change before calling it a reference

- **Subject-matter review.** A PEM stack engineer should review the layer sequence, the water configuration note, and the balance-of-plant routing before this is used in formal training.
- **Recovered water routing.** The return path from the hydrogen separator is labeled simplified. A specific plant design would show it precisely.
- **Narration and captions.** The page has a full transcript, but a voiced version would serve viewers who will not read on-screen text.

## Reusing the engine beyond hydrogen

Nothing in the camera, label system, badge system, capture pipeline, or crawlable page shell is specific to electrolyzers. Replace the stack and plant drawing modules and the timeline copy, and the same engine explains any layered hardware with a process around it: fuel cell stacks, battery cells and packs, heat pumps, water treatment trains, or semiconductor process tools. The expensive part of technical animation is not drawing. It is keeping every frame consistent with the source material as the script changes. A pure frame function makes that a code review instead of a re-render.

---

## Frequently asked questions

**How does a PEM electrolyzer work?**
DC voltage splits water at the anode catalyst into oxygen, protons, and electrons. The proton exchange membrane passes only the protons to the cathode, while electrons travel through the external circuit. At the cathode, protons and electrons combine to form hydrogen gas ([DOE HFTO](https://www.energy.gov/eere/fuelcells/hydrogen-production-electrolysis)).

**What are the main components of a PEM electrolyzer stack?**
Repeating cells, each with bipolar plates and flow channels, an anode porous transport layer (typically sintered titanium), a catalyst-coated membrane, and a cathode gas diffusion layer (typically carbon paper), clamped between end plates with current collectors and manifolds ([NREL 2019](https://docs.nlr.gov/docs/fy19osti/72740.pdf); [NREL 2024](https://docs.nlr.gov/docs/fy24osti/87625.pdf)).

**What are the PEM electrolysis half-reactions?**
Anode: 2H₂O → O₂ + 4H⁺ + 4e⁻. Cathode: 4H⁺ + 4e⁻ → 2H₂. Net: 2H₂O → 2H₂ + O₂.

**What temperature does a PEM electrolyzer run at?**
The DOE gives a typical range of about 70 to 90 °C.

**Why does a PEM electrolyzer circulate so much water?**
Only a small portion of the water fed to the stack is split. The rest carries away heat from cell losses, then passes through a heat exchanger before returning ([NREL 2024](https://docs.nlr.gov/docs/fy24osti/87625.pdf)).

**What is the difference between an MEA and a CCM?**
The catalyst-coated membrane (CCM) is the membrane with catalyst layers on both faces. Membrane electrode assembly (MEA) is used inconsistently: sometimes for the CCM alone, sometimes for the CCM plus the porous transport and gas diffusion layers.

**What is the balance of plant in an electrolyzer?**
Everything outside the stack that makes it work: power conversion (transformer and rectifier), water treatment (filtering and deionization), thermal management, hydrogen separation and drying, piping, instrumentation, and controls ([NREL 2024](https://docs.nlr.gov/docs/fy24osti/87625.pdf)).

**Is the animation to scale?**
No. Layer thicknesses are exaggerated, the cell count is reduced to six, and the molecular sequence is schematic and slowed down. Each of these is labeled on screen when it applies.

---

## Sources

1. U.S. Department of Energy, Hydrogen and Fuel Cell Technologies Office. [Hydrogen Production: Electrolysis](https://www.energy.gov/eere/fuelcells/hydrogen-production-electrolysis). Half-reactions, proton-only membrane, external electron circuit, DC energy input, typical 70 to 90 °C operating range.
2. U.S. Department of Energy, Hydrogen and Fuel Cell Technologies Office. [Hydrogen Production](https://www.energy.gov/eere/fuelcells/hydrogen-production). Electrolysis as a hydrogen production pathway.
3. Mayyas, A., Ruth, M., Pivovar, B., Bender, G., and Wipke, K. [Manufacturing Cost Analysis for Proton Exchange Membrane Water Electrolyzers](https://docs.nlr.gov/docs/fy19osti/72740.pdf). NREL/TP-6A20-72740, 2019. Stack anatomy and component materials.
4. Badgett, A., et al. [Updated Manufactured Cost Analysis for Proton Exchange Membrane Water Electrolyzers](https://docs.nlr.gov/docs/fy24osti/87625.pdf). NREL/TP-6A20-87625, 2024. Balance of plant, water supply, thermal management, hydrogen processing.

**Watch the explainer:** [mizcausevic-dev.github.io/pem-electrolyzer-stack-explainer](https://mizcausevic-dev.github.io/pem-electrolyzer-stack-explainer/)
**Source code:** [github.com/mizcausevic-dev/pem-electrolyzer-stack-explainer](https://github.com/mizcausevic-dev/pem-electrolyzer-stack-explainer)
