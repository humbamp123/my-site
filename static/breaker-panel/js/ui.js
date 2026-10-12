import { appliancePresets, circuitLoadTypes, breakerAmpOptions } from './data.js';

// DOM element references
const applianceRowsContainer = document.getElementById('applianceRows');
const circuitRowsContainer = document.getElementById('circuitRows');
const applianceRowTemplate = document.getElementById('applianceRowTemplate');
const circuitRowTemplate = document.getElementById('circuitRowTemplate');

const errorEls = {
    A: document.getElementById('errorMessageA'),
    B: document.getElementById('errorMessageB'),
};

const resultsEls = {
    A: document.getElementById('resultsA'),
    B: document.getElementById('resultsB'),
};

/**
 * Tiny element builder: h('td', { class: 'x', text: 'y' }, [children])
 */
function h(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else node.setAttribute(key, value);
    }
    for (const child of children) node.append(child);
    return node;
}

function option(value, label) {
    return h('option', { value, text: label });
}

/**
 * Wires up the tab bar: toggles .active and aria-selected on buttons,
 * and shows the matching panel.
 */
export function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-selected', String(isActive));
            });
            panels.forEach(p => {
                p.classList.toggle('active', p.id === btn.getAttribute('aria-controls'));
            });
        });
    });
}

/**
 * Adds an appliance row to Mode A. Selecting a preset fills the
 * name and VA fields (both stay editable).
 */
export function addApplianceRow(presetId = 'dishwasher') {
    const row = applianceRowTemplate.content.cloneNode(true).firstElementChild;
    row.style.animation = 'fadeIn 0.3s ease';

    const presetSelect = row.querySelector('.appliance-preset');
    const nameInput = row.querySelector('.appliance-name');
    const vaInput = row.querySelector('.appliance-va');

    appliancePresets.forEach(p => presetSelect.append(option(p.id, p.label)));

    const applyPreset = () => {
        const preset = appliancePresets.find(p => p.id === presetSelect.value);
        if (!preset) return;
        if (preset.id === 'custom') {
            nameInput.value = '';
            vaInput.value = '';
            nameInput.focus();
        } else {
            nameInput.value = preset.label;
            vaInput.value = preset.va;
        }
    };

    presetSelect.value = presetId;
    applyPreset();
    presetSelect.addEventListener('change', applyPreset);

    applianceRowsContainer.append(row);
}

/**
 * Collects Mode A inputs.
 * @returns {{ sqft, smallApplianceCircuits, laundryCircuits, appliances, hvac, hasError, errorMessage }}
 */
export function collectServiceInputs() {
    const fail = message => ({ hasError: true, errorMessage: message });

    const sqft = parseFloat(document.getElementById('sqft').value);
    if (!sqft || sqft <= 0) {
        return fail('Please enter the dwelling’s living area in square feet.');
    }

    const smallApplianceCircuits = parseInt(document.getElementById('smallApplianceCircuits').value) || 0;
    if (smallApplianceCircuits < 2) {
        return fail('NEC requires at least 2 small-appliance branch circuits.');
    }

    const laundryCircuits = parseInt(document.getElementById('laundryCircuits').value) || 0;
    if (laundryCircuits < 1) {
        return fail('NEC requires at least 1 laundry circuit.');
    }

    const appliances = [];
    for (const row of document.querySelectorAll('.appliance-row')) {
        const name = row.querySelector('.appliance-name').value.trim();
        const va = parseFloat(row.querySelector('.appliance-va').value);
        if (!name && !va) continue; // skip fully empty rows
        if (!name) {
            return fail('Please name every appliance entry.');
        }
        if (!va || va <= 0) {
            return fail(`Please enter a VA rating greater than 0 for “${name}”.`);
        }
        appliances.push({ name, va });
    }

    const hvacValue = id => {
        const v = parseFloat(document.getElementById(id).value);
        return v > 0 ? v : 0;
    };

    return {
        hasError: false,
        errorMessage: '',
        sqft,
        smallApplianceCircuits,
        laundryCircuits,
        appliances,
        hvac: {
            acVA: hvacValue('acVA'),
            heatPumpVA: hvacValue('heatPumpVA'),
            supplementalHeatVA: hvacValue('supplementalHeatVA'),
            electricHeatVA: hvacValue('electricHeatVA'),
        },
    };
}

const fmt = n => Math.round(n).toLocaleString('en-US');

const HVAC_SOURCE_LABELS = {
    ac: 'Air conditioning',
    heatPump: 'Heat pump + supplemental',
    electricHeat: 'Electric space heating',
    none: 'None entered',
};

function breakdownTable(rows) {
    return h('table', { class: 'results-table' }, [
        h('thead', {}, [h('tr', {}, [h('th', { text: 'Item' }), h('th', { text: 'Value' })])]),
        h('tbody', {}, rows.map(([label, value, rowClass]) =>
            h('tr', rowClass ? { class: rowClass } : {}, [
                h('td', { text: label }),
                h('td', { text: value }),
            ])
        )),
    ]);
}

function sectionLabel(text) {
    return h('div', { class: 'section-label', text });
}

function verdictCard(variant, title, body) {
    return h('div', { class: `verdict-card ${variant}` }, [
        h('h3', { text: title }),
        h('p', { text: body }),
    ]);
}

/**
 * Renders the Mode A breakdown table, service-size chips, and verdict card.
 * @param {Object} b - breakdown from calculateServiceLoad()
 */
export function renderServiceResults(b) {
    const chips = h('div', { class: 'service-sizes' },
        b.serviceSizes.map(s =>
            h('span', {
                class: `service-size-chip ${s.adequate ? 'adequate' : 'inadequate'}`,
                text: `${s.amps} A`,
            })
        )
    );

    const verdict = b.minimumService
        ? verdictCard('verdict-pass', `Minimum Service: ${b.minimumService} A`,
            `Calculated load is ${b.amps.toFixed(1)} A at 240 V. The smallest standard service size that covers it is ${b.minimumService} A.`)
        : verdictCard('verdict-fail', 'Exceeds 200 A',
            `Calculated load is ${b.amps.toFixed(1)} A at 240 V — beyond the largest common residential service. A larger service or load management is needed; consult an electrician.`);

    resultsEls.A.replaceChildren(
        sectionLabel('Load Breakdown'),
        breakdownTable([
            [`General load (lighting ${fmt(b.lightingVA)} + circuits ${fmt(b.circuitsVA)} + appliances ${fmt(b.appliancesVA)})`, `${fmt(b.generalLoadVA)} VA`],
            ['First 10,000 VA @ 100%', `${fmt(b.first10kVA)} VA`, 'indent'],
            [`Remaining ${fmt(b.remainderVA)} VA @ 40%`, `${fmt(b.demandedRemainderVA)} VA`, 'indent'],
            [`Heating / cooling @ 100% (${HVAC_SOURCE_LABELS[b.hvacSource]})`, `${fmt(b.hvacVA)} VA`],
            [`Total demand load — ${b.amps.toFixed(1)} A @ 240 V`, `${fmt(b.totalVA)} VA`, 'total-row'],
        ]),
        sectionLabel('Standard Service Sizes'),
        chips,
        verdict
    );

    resultsEls.A.classList.add('show');
    resultsEls.A.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Adds a circuit row to Mode B. Changing breaker amps, poles, or load
 * type re-estimates the VA input (which stays editable).
 */
export function addCircuitRow() {
    const row = circuitRowTemplate.content.cloneNode(true).firstElementChild;
    row.style.animation = 'fadeIn 0.3s ease';

    const ampsSelect = row.querySelector('.circuit-amps');
    const polesSelect = row.querySelector('.circuit-poles');
    const typeSelect = row.querySelector('.circuit-load-type');
    const vaInput = row.querySelector('.circuit-va');

    breakerAmpOptions.forEach(a => ampsSelect.append(option(String(a), `${a} A`)));
    circuitLoadTypes.forEach(t => typeSelect.append(option(t.id, t.label)));

    const estimateVA = () => {
        const type = circuitLoadTypes.find(t => t.id === typeSelect.value);
        if (!type || type.vaPerBreakerAmp === null) return; // custom: leave as typed
        const amps = parseInt(ampsSelect.value);
        const poles = parseInt(polesSelect.value);
        // 2-pole circuits run at 240 V, so the same heuristic doubles
        vaInput.value = amps * type.vaPerBreakerAmp * poles;
    };

    ampsSelect.addEventListener('change', estimateVA);
    polesSelect.addEventListener('change', estimateVA);
    typeSelect.addEventListener('change', estimateVA);
    estimateVA();

    circuitRowsContainer.append(row);
}

/**
 * Collects Mode B inputs.
 * @returns {{ mainBreakerAmps, circuits, hasError, errorMessage }}
 */
export function collectCircuitInputs() {
    const mainBreakerAmps = parseInt(document.getElementById('mainBreaker').value);

    const circuits = [];
    for (const row of document.querySelectorAll('.circuit-row')) {
        const description = row.querySelector('.circuit-desc').value.trim() || 'Unnamed circuit';
        const breakerAmps = parseInt(row.querySelector('.circuit-amps').value);
        const poles = parseInt(row.querySelector('.circuit-poles').value);
        const typeId = row.querySelector('.circuit-load-type').value;
        const va = parseFloat(row.querySelector('.circuit-va').value);
        const type = circuitLoadTypes.find(t => t.id === typeId);

        if (!va || va <= 0) {
            return { hasError: true, errorMessage: `Please enter an estimated load greater than 0 VA for “${description}”.` };
        }

        circuits.push({ description, breakerAmps, poles, loadTypeId: typeId, va, continuous: type ? type.continuous : false });
    }

    if (circuits.length === 0) {
        return { hasError: true, errorMessage: 'Add at least one circuit to check the panel.' };
    }

    return { hasError: false, errorMessage: '', mainBreakerAmps, circuits };
}

/**
 * Renders the Mode B totals, utilization bar, verdict, and honesty note.
 * @param {Object} r - result from calculateTally()
 */
export function renderTallyResults(r) {
    const fill = h('div', { class: `utilization-fill ${r.grade.cssClass}` });
    fill.style.width = `${Math.min(r.utilizationPct, 100)}%`;

    const note = h('div', { class: 'info-note' }, [
        h('strong', { text: 'About this estimate' }),
        'Adding up breaker handles routinely exceeds the main rating in a healthy panel — not every circuit draws its full load at once (the code calls this diversity). This tally is a rough reality check based on your estimated loads, not a code calculation. For sizing a service, use the Service Load (NEC 220.82) tab — and for real decisions, a licensed electrician.',
    ]);

    resultsEls.B.replaceChildren(
        sectionLabel('Panel Check'),
        breakdownTable([
            ['Total estimated connected load', `${fmt(r.totalVA)} VA`],
            ['Continuous portion (counted at 125%)', `${fmt(r.continuousVA)} VA`, 'indent'],
            ['Adjusted load @ 240 V', `${r.adjustedAmps.toFixed(1)} A`],
            [`Panel capacity (${r.mainBreakerAmps} A main)`, `${fmt(r.panelVA)} VA`, 'total-row'],
        ]),
        h('div', { class: 'utilization-track' }, [fill]),
        h('div', {
            class: 'utilization-label',
            text: `${r.utilizationPct.toFixed(0)}% of panel capacity — ${r.grade.label}`,
        }),
        verdictCard(r.grade.verdictClass, r.grade.label,
            `Estimated demand is ${r.adjustedAmps.toFixed(1)} A against a ${r.mainBreakerAmps} A main breaker.`),
        note
    );

    resultsEls.B.classList.add('show');
    resultsEls.B.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Shows an error in the given tab ('A' or 'B'). */
export function showError(which, message) {
    errorEls[which].textContent = message;
    errorEls[which].classList.add('show');
}

/** Hides the error in the given tab. */
export function hideError(which) {
    errorEls[which].classList.remove('show');
    errorEls[which].textContent = '';
}

/** Hides the results in the given tab. */
export function hideResults(which) {
    resultsEls[which].classList.remove('show');
}

/**
 * Event delegation for row remove buttons on both dynamic containers.
 */
export function initRowRemoval() {
    [applianceRowsContainer, circuitRowsContainer].forEach(container => {
        container.addEventListener('click', e => {
            const btn = e.target.closest('.remove-btn');
            if (!btn) return;
            const row = btn.closest('.appliance-row, .circuit-row');
            if (row) {
                row.style.animation = 'fadeIn 0.2s ease reverse';
                setTimeout(() => row.remove(), 150);
            }
        });
    });
}
