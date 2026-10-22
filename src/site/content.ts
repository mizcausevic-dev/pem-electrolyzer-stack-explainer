/**
 * Static page copy injected into index.html at build time, so crawlers and
 * no-JS readers get the full explanation without running the canvas.
 */
export const SITE_URL = 'https://mizcausevic-dev.github.io/pem-electrolyzer-stack-explainer/';
export const REPO_URL = 'https://github.com/mizcausevic-dev/pem-electrolyzer-stack-explainer';
export const VIDEO_FILE = 'media/pem-electrolyzer-stack-explainer-Cursor.mp4';
export const HERO_FILE = 'media/pem-electrolyzer-hero-Cursor.png';
export const OG_FILE = 'media/pem-electrolyzer-og-Cursor.png';

export const CHAPTER_NOTES: Record<number, string> = {
  1: 'An exterior view of a generic stack, then section A–A sweeps down through the flow channels. The camera dives from stack scale to one repeating cell: bipolar plate, anode flow channel, porous transport layer, catalyst-coated membrane, gas diffusion layer, and cathode flow channel. Layer thicknesses are exaggerated so each one is readable.',
  2: 'Deionized water enters the anode inlet manifold, which feeds every cell in parallel. Water rises through each anode channel and wets the porous transport layer until it reaches the anode catalyst. The cathode side has no liquid feed in this generic configuration.',
  3: 'DC power turns on. At molecular scale, in slow motion, water splits at the anode catalyst into oxygen, protons, and electrons. Protons cross the membrane; electrons take the external circuit; they recombine as hydrogen at the cathode. Back at cell scale, oxygen leaves with the excess water and hydrogen leaves through its own manifold.',
  4: 'Cell losses appear as heat, concentrated in the membrane electrode assembly. Most of the circulating water is not consumed, so it carries that heat out of the stack. A qualitative diagram shows water temperature rising along a channel, and the camera pulls back to the loop: tank, pump, heat exchanger, and return.',
  5: 'The stack becomes one block in the balance of plant: AC power is transformed and rectified to DC; feed water is filtered and deionized; a tank separates oxygen from the circulating water; hydrogen is separated from water, dried, and delivered; sensors and controls close the loop. The view holds on the complete system.',
};

export const SOURCES: { title: string; org: string; url: string; supports: string }[] = [
  {
    title: 'Hydrogen Production: Electrolysis',
    org: 'U.S. Department of Energy, Hydrogen and Fuel Cell Technologies Office',
    url: 'https://www.energy.gov/eere/fuelcells/hydrogen-production-electrolysis',
    supports: 'PEM half-reactions, solid polymer electrolyte, proton transport, typical 70–90 °C operating range.',
  },
  {
    title: 'Hydrogen Production',
    org: 'U.S. Department of Energy, Hydrogen and Fuel Cell Technologies Office',
    url: 'https://www.energy.gov/eere/fuelcells/hydrogen-production',
    supports: 'Mechanism reference named in the brief: electrolysis as a hydrogen production pathway.',
  },
  {
    title: 'Manufacturing Cost Analysis for Proton Exchange Membrane Water Electrolyzers (NREL/TP-6A20-72740, 2019)',
    org: 'National Renewable Energy Laboratory',
    url: 'https://docs.nlr.gov/docs/fy19osti/72740.pdf',
    supports: 'Stack anatomy: repeating cells electrically in series with water and product gas in parallel, end plates, CCM, sintered porous titanium PTL (anode), carbon paper (cathode), bipolar plates.',
  },
  {
    title: 'Updated Manufactured Cost Analysis for Proton Exchange Membrane Water Electrolyzers (NREL/TP-6A20-87625, 2024)',
    org: 'National Renewable Energy Laboratory',
    url: 'https://docs.nlr.gov/docs/fy24osti/87625.pdf',
    supports: 'Balance of plant: transformer and rectifier (AC to DC), water filtering and deionization, feedwater tank on the oxygen side, radiator cooling of circulating water, hydrogen separation and drying, instrumentation.',
  },
];
