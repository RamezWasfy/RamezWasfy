/* Local educational models. No telemetry, vendor APIs or infrastructure actions. */
(() => {
  const fmt = (n, digits = 2) => Number(n).toLocaleString('en', {maximumFractionDigits: digits});
  document.querySelectorAll('[data-finops]').forEach(root => {
    const form = root.querySelector('form');
    const output = root.querySelector('.calculation-result');
    const field = name => form.elements.namedItem(name);
    const num = name => Number(field(name).value);
    const checked = name => field(name).checked;
    const result = (title, detail, extra = '') => {output.innerHTML = `<h4>${title}</h4><p>${detail}</p>${extra}`;};
    const track = (fraction, description) => `<div class="budget-track" role="img" aria-label="${description}"><span style="width:${Math.max(0,Math.min(100,fraction*100))}%"></span></div>`;
    const update = () => {
      if (!form.checkValidity()) {result('Check the sample inputs','Enter values within the labeled ranges. Invalid inputs do not produce a recommendation.');return;}
      if (root.dataset.finops === 'sleep-budget') {
        const wake = num('wake'), sleep = num('sleep');
        if (wake >= sleep) {result('Choose a daytime working-hours window','For this model, the weekday wake hour must be earlier than the sleep hour. Overnight windows need a different weekend event calculation.');return;}
        const daily = sleep - wake;
        const awake = daily * 5, asleep = 168 - awake;
        const variable = num('variable'), fixed = num('fixed');
        const baseline = (variable + fixed) * 168;
        const scheduled = variable * awake + fixed * 168;
        const potential = variable * asleep;
        const share = baseline ? potential / baseline : 0;
        result(`${fmt(awake,0)} intended awake hours per week`,`${fmt(asleep,0)} hours asleep. Baseline: ${fmt(baseline)} units; scheduled model: ${fmt(scheduled)} units; potentially avoided variable cost: ${fmt(potential)} units (${fmt(share*100,1)}% of this sample total).`,track(awake/168,`${fmt(awake,0)} of 168 hours awake`)+`<p class="calculation-caution">The retained fixed component is ${fmt(fixed*168)} units. Actual savings need healthy sleep/wake behavior and successful removal of eligible underlying capacity.</p>`);
      } else if (root.dataset.finops === 'commitment-ratios') {
        const committed = num('committed'), consumed = num('consumed'), eligible = num('eligible');
        if (consumed > committed || consumed > eligible) {result('Check the common-basis amounts','Consumed units must fit within both committed units and eligible demand in this example.');return;}
        const utilization = committed ? consumed/committed : null;
        const coverage = eligible ? consumed/eligible : null;
        result(utilization === null ? 'Utilization is undefined at zero commitment' : `${fmt(utilization*100,1)}% commitment utilization`,`${fmt(committed-consumed)} unused units/hour. ${coverage === null ? 'Coverage is undefined because eligible demand is zero.' : `${fmt(coverage*100,1)}% of eligible demand is covered on the same normalized basis.`}`,utilization === null ? '' : track(utilization,`${fmt(utilization*100,1)} percent of the commitment consumed`));
      } else if (root.dataset.finops === 'allocation-policy') {
        const cpu = num('cpu'), memory = num('memory'), hours = num('hours');
        const maximum = Math.max(cpu,memory), additive = cpu+memory;
        const isMax = field('policy').value === 'max';
        const selected = isMax ? maximum : additive;
        const scale = Math.max(additive,1);
        const rows = [['Max policy',maximum],['Additive policy',additive]].map(([name,value])=>`<div class="owner-bar-row"><span>${name}</span><div class="owner-bar-track"><span style="width:${value/scale*100}%"></span></div><strong>${fmt(value)} /h</strong></div>`).join('');
        result(`${fmt(selected)} units/hour under ${isMax ? 'max' : 'additive'} policy`,`${fmt(selected)} × ${fmt(hours,0)} complete hours = ${fmt(selected*hours)} period units. The policy difference is ${fmt(additive-maximum)} units/hour, or ${fmt((additive-maximum)*hours)} over this sample period.`,`<div class="owner-cost" role="img" aria-label="Max policy ${fmt(maximum)} and additive policy ${fmt(additive)} units per hour">${rows}</div><p class="calculation-caution">These are alternative definitions, so they must not be added together or silently mixed across team and application totals.</p>`);
      } else if (root.dataset.finops === 'gpu-eligibility') {
        const requested = num('requested');
        if (!checked('tolerates')) {result('Blocked by the NoSchedule taint','The pod lacks the matching toleration for this node. Adding a pool selector or a GPU request does not bypass the taint.');return;}
        if (!checked('compatible')) {result('Blocked by another modeled scheduling requirement','Placement still needs compatible CPU, memory, topology and other constraints. A GPU toleration does not override those requirements.');return;}
        if (!requested) {result('No GPU is allocated by this request','This modeled pod can pass the taint and other placement checks, but it reserves zero devices. Admission policy should validate whether it belongs on accelerated capacity.');return;}
        if (!checked('devices')) {result('No advertised GPU capacity','The healthy device integration is absent in this sample. A GPU instance family or a matching label alone cannot allocate a device.');return;}
        if (requested > 1) {result('Pending: not enough free GPUs on this node',`The pod requests ${requested} devices, but this node has one free (two allocatable minus one allocated). Additional suitable capacity still requires cloud availability and a compatible provisioning policy.`);return;}
        result('Eligible for one GPU in this limited model','The pod tolerates the taint, other modeled requirements match, and one advertised device is free.',`<p class="calculation-caution">${checked('selector') ? 'The selector expresses the dedicated-pool requirement.' : 'Without the explicit selector, this node is still compatible, but the dedicated-pool intention is unspecified; another compatible GPU pool could also be eligible.'} Actual scheduling, startup and useful GPU execution still need verification.</p>`);
      }
    };
    form.addEventListener('input',update);
    form.addEventListener('change',update);
    update();
  });
})();
