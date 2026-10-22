# How a PEM Electrolyzer Stack Works: Water In, Hydrogen Out, and the Membrane in Between

**SEO title:** How a PEM Electrolyzer Stack Works | MEA, Bipolar Plates, Water Feed, Gas Evolution, Cooling, and Balance of Plant Explained
**Meta description:** A clear, mechanism-first explanation of a generic PEM electrolyzer stack: how the membrane electrode assembly splits water, why protons and electrons take different paths, how cooling protects the stack, and why balance of plant matters. No efficiency claims, no commercial specifications.
**Primary keyword:** PEM electrolyzer stack
**Secondary keywords:** proton exchange membrane electrolysis, membrane electrode assembly, MEA, bipolar plate, hydrogen production electrolysis, balance of plant electrolyzer, PEM water electrolysis explained
**Tags for Medium:** Hydrogen, Electrolysis, Clean Energy, Engineering, Energy Systems
**Hero image:** `hero-Cursor.png`. Alt text: Sectional schematic of a generic PEM electrolyzer cell showing end plates, bipolar plates, gas diffusion layers, catalyst layers, membrane, water feed, oxygen outlet, hydrogen outlet, and DC power input. Caption: A generic PEM electrolyzer cell in section. Schematic, not to scale. Explanatory colors do not represent literal emission.

---

Water goes in. Hydrogen and oxygen come out. That sentence is accurate, and it explains almost nothing.

The interesting part is the constraint in the middle. A proton exchange membrane electrolyzer, usually shortened to PEM electrolyzer, forces water to split by giving its pieces only one workable route each. Protons may cross the membrane. Electrons may not. Oxygen leaves one side. Hydrogen leaves the other. Everything in the stack exists to maintain that constraint, repeat it hundreds of times in series, feed it, cool it, and keep it sealed under pressure.

This article follows that causal chain in the same order as the 34-second motion explainer published with it: reveal the membrane electrode assembly and plates, show the water feed, trace gas evolution, show cooling, then pull back to balance of plant. If you open the interactive player, you can scrub all 1,020 frames and stop on any single step. The article below is the written version of that sequence.

## 1. The repeating cell is the product

A PEM stack is not one large reaction chamber. It is a repeating electrochemical cell compressed between end plates.

Read one cell from the center out. At the center is the membrane, a thin polymer layer that conducts protons while blocking gases and electrons. Coated or pressed against it are two catalyst layers, anode on one side and cathode on the other. Membrane plus catalysts is the core of the membrane electrode assembly, or MEA. Outside the catalyst layers sit gas diffusion layers, porous structures that distribute water and gas while carrying electrons. Outside those sit bipolar plates. Their machined or stamped flow fields distribute water across the active area, collect product gases, conduct electrons to the next cell, and in many designs carry coolant.

Then the pattern repeats. One bipolar plate can serve as the cathode side of one cell and the anode side of the next, which is why it is called bipolar.

The end plates and tie rods do not cause the reaction. They hold the stack in compression so seals seal, contact resistance stays controlled, and layers stay in contact. That distinction matters. In an electrolyzer, mechanical compression is part of electrical and chemical performance because a gap is not just a gap. It can become a leak path, a resistance, or an uneven flow distribution.

A useful mental model: the MEA is where chemistry happens. Everything around it is logistics.

## 2. Water feed is delivery, not reaction

Deionized water is fed to the anode side of the cell. The bipolar plate flow field spreads it across the active area.

That sounds minor until you consider what uneven delivery creates. A region starved of water cannot react at the same rate as a flooded region. Flow distribution is therefore not plumbing decoration. It determines whether the full active area participates.

Water quality also matters because the membrane and catalysts are sensitive to contaminants. That is why water purification belongs in the system diagram even though it never appears inside the stack. The stack receives prepared water, not whatever happens to be in a pipe.

At this stage, nothing has split. No hydrogen exists yet in the product stream. The system has only delivered the reactant to the place where electrical energy can act on it.

Delivery before reaction. That order is easy to skip in a static diagram, and it is one reason a motion explainer helps. Cause has a sequence.

## 3. Gas evolution is two paths forced apart

Apply DC power across the cell and the anode catalyst supports the oxygen evolution reaction:

**Anode: 2H2O → O2 + 4H+ + 4e−**

Water splits into oxygen gas, protons, and electrons.

Now the membrane enforces the separation that defines the device. Protons move through the membrane toward the cathode. Electrons cannot follow. They travel through the conductive plates and the external circuit, driven by the power supply, to reach the cathode side.

At the cathode catalyst, protons and electrons recombine:

**Cathode: 4H+ + 4e− → 2H2**

Add the two half-reactions and the bookkeeping resolves to the overall reaction:

**Overall: 2H2O → 2H2 + O2**

For every two water molecules consumed, two hydrogen molecules and one oxygen molecule are produced. That stoichiometric relationship comes from the reaction equations, not from a vendor datasheet.

Notice what the design accomplishes. Hydrogen and oxygen are generated on opposite sides of a gas-blocking membrane, so the products are born separated. The electron path through the external circuit is also the point where electrical energy enters the chemical system. The membrane does not create energy. It creates separation, and separation is what makes the products collectable as distinct streams.

In the explainer, this chapter runs in labeled slow motion. Proton movement, bubble formation, and gas collection do not occur as neat, evenly spaced visual events in a real stack. The animation slows and enlarges them so direction and sequence can be read. It shows mechanism, not measured rate.

## 4. Cooling protects the membrane and the operating window

If every unit of electrical input became chemical energy stored in hydrogen, cooling would be a smaller problem. Real electrochemical systems also produce heat through resistive and reaction losses. This article makes no efficiency claim about any specific stack, because efficiency depends on design, operating point, and system boundaries. The narrower point is thermal: heat generated in the stack must leave, or stack temperature rises.

Coolant channels, often integrated into or adjacent to the bipolar plates, carry heat out to an external loop and heat exchanger. Temperature sensors report back, and controls adjust flow or power.

Cooling therefore does three jobs at once. It protects temperature-sensitive materials, including the membrane. It keeps the stack inside the operating window its seals, catalysts, and materials were designed for. And it makes operation repeatable, because a stack that drifts hotter through a run is not running the same experiment at minute ten that it ran at minute one.

Heat management is not a support feature added after the electrochemical design is finished. It is part of the electrochemical design, because temperature changes reaction kinetics, material behavior, water management, and degradation pathways at the same time.

## 5. Balance of plant is the rest of the chemical plant

Pull the camera back and the stack shrinks. Around it appears the balance of plant:

Water purification and feed supply the reactant at the quality the stack requires. Power conversion supplies controlled DC power. Gas-liquid separators separate product gas from entrained water. Dryers reduce moisture in the hydrogen stream where the application requires it. Cooling loops reject heat. Valves, pumps, pressure and temperature sensors, hydrogen detection, ventilation, and control systems move fluids, hold conditions, and shut the system down when conditions leave the safe envelope.

This is the point where an electrolyzer stops reading as a device and starts reading as a small chemical plant.

That reframing has practical consequences. Cost, footprint, maintenance, reliability, and safety do not live only in the stack. A stack improvement that requires more complex purification, drying, compression, cooling, or controls has not automatically improved the system. Conversely, a mundane balance-of-plant improvement in reliability or serviceability can change whether a project operates consistently enough to matter.

When you evaluate any electrolyzer claim, ask where the system boundary was drawn. Stack only, or stack plus the plant required to run it? Many disagreements about performance are, at bottom, disagreements about that boundary. This explainer deliberately ends on the wide shot so the boundary stays visible.

## What this explainer does not claim

This is a generic PEM explainer built for mechanism education.

It does not claim an efficiency for any product. It does not publish a current density, voltage, pressure, temperature, production rate, degradation rate, or lifetime for a commercial stack. It does not reproduce a proprietary flow-field geometry. Its sectional view, bubble motion, ion hops, and flow pulses are labeled schematics that show sequence and direction, not simulation output.

The underlying electrolysis process is referenced to the U.S. Department of Energy hydrogen production resources at energy.gov/eere/fuelcells/hydrogen-production. Camera moves, palette, timing, and cutaways are original illustrative choices, not experimentally validated observations.

Verify subject-specific details before using any part of this explainer for engineering design, procurement, safety review, or publication claims about a specific commercial system.

## The one-sentence version

A PEM electrolyzer splits water by letting protons cross a membrane while forcing electrons through an external circuit, then surrounds that repeating cell with enough feeding, cooling, separation, drying, power, sensing, and control equipment to run the constraint continuously and safely.

Remember the membrane rule, and the rest of the machine explains itself.

---

**Watch and scrub the explainer:** [Live interactive player on GitHub Pages, link to be inserted after Pages deployment]
**Source code and frame engine:** [GitHub repository, link to be inserted after publication]
**Reference:** U.S. Department of Energy, Hydrogen Production, https://www.energy.gov/eere/fuelcells/hydrogen-production

*Editorial note: Consolidated working explainer, not a certified engineering reference. Generic PEM only. No efficiency claims. No invented specifications.*
