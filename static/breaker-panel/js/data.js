// NEC 220.82 Optional Method constants
export const VA_PER_SQFT = 3;              // 220.82(B)(1) general lighting load
export const CIRCUIT_VA = 1500;            // 220.82(B)(2) small-appliance & laundry circuits
export const DEMAND_THRESHOLD_VA = 10000;  // first 10 kVA of general load at 100%
export const DEMAND_REMAINDER_FACTOR = 0.4; // remainder of general load at 40%
export const SERVICE_VOLTAGE = 240;        // split-phase residential service
export const STANDARD_SERVICE_SIZES = [100, 125, 150, 200];

// Circuit tally guidance
export const CONTINUOUS_FACTOR = 0.8;      // continuous loads limited to 80% of breaker rating

export const appliancePresets = [
    { id: 'dishwasher',  label: 'Dishwasher',        va: 1200 },
    { id: 'disposal',    label: 'Garbage Disposal',  va: 900 },
    { id: 'microwave',   label: 'Microwave',         va: 1500 },
    { id: 'waterHeater', label: 'Water Heater',      va: 4500 },
    { id: 'dryer',       label: 'Clothes Dryer',     va: 5000 },
    { id: 'range',       label: 'Range / Oven',      va: 12000 },
    { id: 'evCharger',   label: 'EV Charger (L2)',   va: 9600 },
    { id: 'custom',      label: 'Custom…',      va: null },
];

// Estimated VA per breaker amp is a rough heuristic for typical actual
// loads on a general-purpose circuit (not the breaker's full rating).
export const circuitLoadTypes = [
    { id: 'lighting',   label: 'Lighting / receptacles (est.)', vaPerBreakerAmp: 60,  continuous: false },
    { id: 'appliance',  label: 'Dedicated appliance',           vaPerBreakerAmp: 100, continuous: false },
    { id: 'continuous', label: 'Continuous load (3+ hrs)',      vaPerBreakerAmp: 100, continuous: true },
    { id: 'custom',     label: 'Custom VA',                     vaPerBreakerAmp: null, continuous: false },
];

export const breakerAmpOptions = [15, 20, 30, 40, 50, 60];

// Utilization grades for the circuit tally (percent of panel capacity)
export const utilizationGrades = [
    { maxPct: 60,       label: 'Comfortable',   cssClass: 'util-ok',   verdictClass: 'verdict-pass' },
    { maxPct: 100,      label: 'Getting Full',  cssClass: 'util-warn', verdictClass: 'verdict-warn' },
    { maxPct: Infinity, label: 'Over Capacity', cssClass: 'util-over', verdictClass: 'verdict-fail' },
];
