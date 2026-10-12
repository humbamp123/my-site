import {
    VA_PER_SQFT,
    CIRCUIT_VA,
    DEMAND_THRESHOLD_VA,
    DEMAND_REMAINDER_FACTOR,
    SERVICE_VOLTAGE,
    STANDARD_SERVICE_SIZES,
    CONTINUOUS_FACTOR,
    utilizationGrades,
} from './data.js';
import {
    initTabs,
    initRowRemoval,
    addApplianceRow,
    addCircuitRow,
    collectServiceInputs,
    collectCircuitInputs,
    renderServiceResults,
    renderTallyResults,
    showError,
    hideError,
    hideResults,
} from './ui.js';

/* =============================================
   MODE A - NEC 220.82 OPTIONAL METHOD
   ============================================= */

/**
 * Applies the 220.82(B) demand factor to the general load:
 * the first 10 kVA counts at 100%, the remainder at 40%.
 * Returns a breakdown so the results table can itemize each step.
 *
 * @param {number} generalLoadVA - total general load before demand factors
 * @returns {{ first10kVA: number, remainderVA: number, demandedRemainderVA: number, demandedTotalVA: number }}
 */
function applyDemandFactor(generalLoadVA) {
    const first10kVA = Math.min(generalLoadVA, DEMAND_THRESHOLD_VA);
    const remainderVA = Math.max(generalLoadVA - DEMAND_THRESHOLD_VA, 0);
    const demandedRemainderVA = remainderVA * DEMAND_REMAINDER_FACTOR;
    return {
        first10kVA,
        remainderVA,
        demandedRemainderVA,
        demandedTotalVA: first10kVA + demandedRemainderVA,
    };
}

/**
 * Picks the heating/cooling load per 220.82(C): the LARGEST of the
 * candidate systems applies, because heating and cooling never run
 * at the same time. Heat pump + supplemental are summed — a
 * simplification of 220.82(C)(3), which the tool's copy discloses.
 *
 * @param {{ acVA: number, heatPumpVA: number, supplementalHeatVA: number, electricHeatVA: number }} hvac
 *        - each value is 0 when the field was left blank
 * @returns {{ hvacVA: number, hvacSource: 'ac'|'heatPump'|'electricHeat'|'none' }}
 */
function largestHvacLoad(hvac) {
    const candidates = [
        { hvacSource: 'ac', hvacVA: hvac.acVA },
        { hvacSource: 'heatPump', hvacVA: hvac.heatPumpVA + hvac.supplementalHeatVA },
        { hvacSource: 'electricHeat', hvacVA: hvac.electricHeatVA },
    ];
    const largest = candidates.reduce((best, c) => (c.hvacVA > best.hvacVA ? c : best));
    return largest.hvacVA > 0 ? largest : { hvacVA: 0, hvacSource: 'none' };
}

/**
 * Runs the full 220.82 optional-method calculation.
 * @param {Object} inputs - from collectServiceInputs()
 * @returns {Object} breakdown consumed by renderServiceResults()
 */
export function calculateServiceLoad(inputs) {
    const lightingVA = inputs.sqft * VA_PER_SQFT;
    const circuitsVA = (inputs.smallApplianceCircuits + inputs.laundryCircuits) * CIRCUIT_VA;
    const appliancesVA = inputs.appliances.reduce((sum, a) => sum + a.va, 0);
    const generalLoadVA = lightingVA + circuitsVA + appliancesVA;

    const demand = applyDemandFactor(generalLoadVA);
    const { hvacVA, hvacSource } = largestHvacLoad(inputs.hvac);

    const totalVA = demand.demandedTotalVA + hvacVA;
    const amps = totalVA / SERVICE_VOLTAGE;

    const serviceSizes = STANDARD_SERVICE_SIZES.map(size => ({
        amps: size,
        adequate: amps <= size,
    }));
    const adequate = serviceSizes.find(s => s.adequate);

    return {
        lightingVA,
        circuitsVA,
        appliancesVA,
        generalLoadVA,
        first10kVA: demand.first10kVA,
        remainderVA: demand.remainderVA,
        demandedRemainderVA: demand.demandedRemainderVA,
        hvacVA,
        hvacSource,
        totalVA,
        amps,
        serviceSizes,
        minimumService: adequate ? adequate.amps : null,
    };
}

/* =============================================
   MODE B - CIRCUIT TALLY
   ============================================= */

/**
 * Grades panel utilization for the tally verdict, using the
 * `utilizationGrades` thresholds in data.js (tune them there).
 *
 * @param {number} pct - utilization percentage (can exceed 100)
 * @returns {{ maxPct: number, label: string, cssClass: string, verdictClass: string }}
 */
function gradeUtilization(pct) {
    return utilizationGrades.find(g => pct <= g.maxPct);
}

/**
 * Sums estimated circuit loads and compares against panel capacity.
 * Continuous loads are counted at 125% (the inverse of the 80% rule),
 * applied to the LOAD side only so capacity is never double-derated.
 * @param {Object} inputs - from collectCircuitInputs()
 * @returns {Object} result consumed by renderTallyResults()
 */
export function calculateTally(inputs) {
    const totalVA = inputs.circuits.reduce((sum, c) => sum + c.va, 0);
    const continuousVA = inputs.circuits
        .filter(c => c.continuous)
        .reduce((sum, c) => sum + c.va, 0);

    const adjustedVA = (totalVA - continuousVA) + continuousVA / CONTINUOUS_FACTOR;
    const adjustedAmps = adjustedVA / SERVICE_VOLTAGE;

    const panelVA = inputs.mainBreakerAmps * SERVICE_VOLTAGE;
    const utilizationPct = (adjustedVA / panelVA) * 100;

    return {
        mainBreakerAmps: inputs.mainBreakerAmps,
        totalVA,
        continuousVA,
        adjustedVA,
        adjustedAmps,
        panelVA,
        utilizationPct,
        grade: gradeUtilization(utilizationPct),
    };
}

/* =============================================
   EVENT WIRING
   ============================================= */

function runServiceCalc() {
    hideError('A');
    const inputs = collectServiceInputs();
    if (inputs.hasError) {
        showError('A', inputs.errorMessage);
        hideResults('A');
        return;
    }
    renderServiceResults(calculateServiceLoad(inputs));
}

function runTally() {
    hideError('B');
    const inputs = collectCircuitInputs();
    if (inputs.hasError) {
        showError('B', inputs.errorMessage);
        hideResults('B');
        return;
    }
    renderTallyResults(calculateTally(inputs));
}

function init() {
    initTabs();
    initRowRemoval();

    document.getElementById('addApplianceBtn').addEventListener('click', () => addApplianceRow());
    document.getElementById('addCircuitBtn').addEventListener('click', () => addCircuitRow());
    document.getElementById('calcServiceBtn').addEventListener('click', runServiceCalc);
    document.getElementById('calcTallyBtn').addEventListener('click', runTally);

    // Seed one row in each mode so the forms aren't empty
    addApplianceRow();
    addCircuitRow();
}

document.addEventListener('DOMContentLoaded', init);
