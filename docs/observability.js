/* Educational calculators only. No API calls or infrastructure operations. */
(() => {
  const format = (n, digits = 0) => Number(n).toLocaleString('en', {maximumFractionDigits: digits});
  const fixed = (n, digits = 2) => Number(n).toFixed(digits);
  document.querySelectorAll('[data-observability]').forEach(root => {
    const form = root.querySelector('form');
    const output = root.querySelector('.calculation-result');
    const field = name => form.elements.namedItem(name);
    const num = name => Number(field(name).value);
    const value = name => field(name).value;
    const result = (title, detail, extra = '') => {
      output.innerHTML = `<h4>${title}</h4><p>${detail}</p>${extra}`;
    };
    const update = () => {
      if (!form.checkValidity()) {result('Check the sample inputs', 'Use values within the labeled ranges. No recommendation is calculated from invalid inputs.'); return;}
      const key = root.dataset.observability;
      if (key === 'alert-logic') {
        const requests = num('requests'), failures = num('failures'), timeouts = num('timeouts');
        if (failures > requests || timeouts > requests) {result('Check the event population', 'Failures and timeouts cannot exceed the number of eligible request events in this example.'); return;}
        if (!field('telemetry').checked) {result('Unknown: telemetry is incomplete', 'No alert match is inferred from absent data. Investigate the observation path before treating an empty result as healthy.'); return;}
        const sustained = field('sustained').checked;
        const single = value('mode') === 'single';
        const rate = requests ? failures / requests * 100 : 0;
        const matches = sustained && (single ? failures >= 20 : requests >= 100 && rate >= 2 && timeouts >= 10);
        const detail = single ? `${format(failures)} failures against a count threshold of 20.` : `${format(requests)} requests, ${fixed(rate)}% failures and ${format(timeouts)} dependency timeouts. Required: ≥100 requests, ≥2% failures and ≥10 timeouts.`;
        result(matches ? 'Matches the sample condition' : 'Does not match the sample condition', `${detail} Sustained condition: ${sustained ? 'yes' : 'no'}.`, '<p class="calculation-caution">A non-match does not prove service health. Composite correlation can exclude other failure modes.</p>');
      } else if (key === 'maturity-score') {
        const names = ['operations', 'security', 'delivery', 'recovery'];
        const missing = names.filter(n => value(n) === 'missing');
        if (missing.length) {result('M0: assessment incomplete', `${missing.map(n => n[0].toUpperCase() + n.slice(1)).join(', ')} needs a completed questionnaire. This is missing assessment evidence, not proof that every control is absent.`); return;}
        const score = Math.min(...names.map(num));
        const weakest = names.filter(n => num(n) === score).join(', ');
        result(`M${score}: minimum evidenced domain`, `Weakest domain${weakest.includes(',') ? 's' : ''}: ${weakest}. Agree on one owned improvement and the evidence needed to reassess it.`, score === 4 ? '<p class="calculation-caution">M4 is shown for exploration. The original guide did not implement its checklists, so this is not evidence of an achieved organization-wide level.</p>' : '');
      } else if (key === 'slo-budget') {
        const requests = num('requests'), failures = num('failures');
        if (failures > requests) {result('Check the request counts', 'Failed requests cannot exceed eligible requests.'); return;}
        if (!requests) {result('No request-based observation', 'There are no eligible requests in this sample. An availability ratio and burn rate are undefined. Missing telemetry needs its own check.'); return;}
        const fraction = (100 - num('target')) / 100;
        const allowed = requests * fraction;
        const remaining = allowed - failures;
        const used = failures / allowed * 100;
        const success = (1 - failures / requests) * 100;
        const burn = failures / requests / fraction;
        const coverage = num('retention') >= num('window');
        const percent = Math.max(0, Math.min(100, 100 - used));
        result(`${fixed(success, 3)}% observed success`, `${format(allowed, 2)} allowed failures; ${format(failures)} observed. ${fixed(100 - used, 1)}% of the budget remains, with ${fixed(burn, 2)}× burn over this sample window.`, `<div class="budget-track" role="img" aria-label="${fixed(percent,1)} percent of the error budget remaining"><span style="width:${percent}%"></span></div><p>${remaining >= 0 ? `${format(remaining, 2)} failures remain in the event budget.` : `The event budget is exceeded by ${format(-remaining, 2)} failures.`}</p><p class="calculation-caution">${coverage ? 'Retention can cover this window, but ingestion continuity and query coverage still need verification.' : `History is too short: ${num('retention')} retained days cannot establish a complete ${num('window')}-day objective. The arithmetic above describes only the entered sample.`}</p>`);
      } else if (key === 'keda-scaling') {
        const current = num('current');
        if (value('health') === 'failed') {
          const fallback = num('fallback');
          result(`${format(fallback)} static fallback replica${fallback === 1 ? '' : 's'}`, `This sample is past the configured failure threshold. ${fallback < current ? `Capacity drops from ${current} to ${fallback}; verify this is safe for current demand.` : 'Fallback still needs a workload-specific capacity test.'}`, '<p class="calculation-caution">Metric failure is not evidence of low demand. Version-specific fallback behavior and HPA reconciliation remain relevant.</p>'); return;
        }
        const average = value('type') === 'AverageValue';
        const raw = Math.ceil((average ? 1 : current) * num('signal') / num('target'));
        const bounded = Math.max(1, Math.min(4, raw));
        const formula = average ? `ceil(${num('signal')} / ${num('target')})` : `ceil(${current} × ${num('signal')} / ${num('target')})`;
        result(`${format(bounded)} replicas after bounds`, `${value('type')}: ${formula} = ${format(raw)} before min 1/max 4. This is a positive-signal teaching model; the real control loop also applies its behavior and readiness checks.`, raw > 4 ? '<p class="calculation-caution">The maximum limits this recommendation. Investigate demand and capacity rather than assuming four replicas are sufficient.</p>' : '');
      }
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    update();
  });
})();
