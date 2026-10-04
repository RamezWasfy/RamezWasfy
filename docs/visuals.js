(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => '$' + n.toFixed(2);
  const getConfig = root => JSON.parse(root.querySelector('.visual-config').textContent);
  const fixture = [
    {name:'dte-checkout',owner:'Engineer A',type:'ephemeral',age:8,rate:.20,ready:3,desired:3,cpu:.42,cpuRequest:1,cpuLimit:2,memory:620,memRequest:1024,memLimit:2048,pods:3,workers:2,threads:6,maxThreads:10,backlog:0},
    {name:'dte-search',owner:'Engineer B',type:'ephemeral',age:3,rate:.12,ready:1,desired:2,cpu:.76,cpuRequest:1,cpuLimit:2,memory:740,memRequest:1024,memLimit:2048,pods:2,workers:2,threads:9,maxThreads:10,backlog:3},
    {name:'dte-payments',owner:'Engineer A',type:'persistent',age:36,rate:.35,ready:4,desired:4,cpu:.58,cpuRequest:2,cpuLimit:4,memory:1150,memRequest:2048,memLimit:4096,pods:4,workers:3,threads:8,maxThreads:15,backlog:0},
    {name:'dte-review',owner:'Engineer C',type:'persistent',age:72,rate:.18,ready:2,desired:2,cpu:.24,cpuRequest:1,cpuLimit:2,memory:420,memRequest:1024,memLimit:2048,pods:2,workers:2,threads:4,maxThreads:10,backlog:0}
  ];
  function initFlow(root) {
    const data = getConfig(root), buttons = [...root.querySelectorAll('[data-step]')];
    const detail = root.querySelector('.flow-detail'), selector = root.querySelector('.visual-mode');
    let active = 0;
    function render() {
      const step = [...data.steps[active]], mode = selector?.value;
      let note = '';
      if (root.dataset.key === 'cloud-workflow') {
        const isAWS = mode === 'AWS';
        note = `${mode} resource operations use their own provider configuration. Both inspected cloud trees used the shared encrypted S3 state backend, with separate key prefixes.`;
        if (active === 0) step[3] = isAWS ? 'aws/accounts/development/eu-central-1/staging/application' : 'gcp/projects/analytics/europe-west1/staging/dataset';
        if (active === 1) step[3] = isAWS ? 'AWS provider + account identity\nstate key: aws/<unit path>/terraform.tfstate' : 'Google provider + project identity\nstate key: gcp/<unit path>/terraform.tfstate';
      }
      if (root.dataset.key === 'module-release') {
        const examples = {
          Patch:['v2.4.2','Example: a compatible correction that preserves the consumer contract.'],
          Minor:['v2.5.0','Example: an optional capability with unchanged existing behavior.'],
          Major:['v3.0.0','Example: a required input rename or output removal that needs consumer migration.']
        };
        const [version, explanation] = examples[mode];
        note = `${explanation} This is a compatibility teaching example. The inspected release automation did not classify changes automatically.`;
        if (active === 2) step[3] = `draft release -> compatibility review -> ${version}`;
        if (active === 3) step[3] = `ref=v2.4.1 -> ref=${version}`;
      }
      if (root.dataset.key === 'lambda-race') {
        const corrected = mode === 'Two-phase wait';
        note = corrected ? 'The wrapper waits for activity to appear, then waits for completion. The global status counter remains a heuristic rather than durable per-event tracking.' : 'An immediate zero can be observed before work starts. Returning here can freeze the execution environment with the plan still pending.';
        if (active === 2) step[3] = corrected ? 'Phase 1: poll for start\ndefault grace: 10 seconds\nstart polling: 100 milliseconds' : 'First status: 0\nreturn immediately\nwork may not have begun';
        if (active === 3) {
          step[2] = corrected ? 'After observing an operation, keep the invocation active until work completes or the reserved deadline is reached.' : 'The immediate-return path ends the invocation before queued work has guaranteed time to run. A successful HTTP response can coexist with a missing plan comment.';
          step[3] = corrected ? 'Phase 2: poll for completion\ndefault interval: 500 milliseconds\nretain deadline reserve' : 'Handler returns -> environment can freeze\nqueued operation has no completion guarantee';
        }
      }
      buttons.forEach((button, i) => {button.setAttribute('aria-pressed', String(i === active)); button.classList.toggle('is-selected', i === active);});
      detail.querySelector('h4').textContent = step[0];
      detail.querySelector('p').textContent = step[2];
      detail.querySelector('code').textContent = step[3];
      root.querySelector('.flow-mode-note').textContent = note;
    }
    buttons.forEach(button => button.addEventListener('click', () => {active = Number(button.dataset.step); render();}));
    selector?.addEventListener('change', render);
    render();
  }
  function initRequest(root) {
    const form = root.querySelector('form'), result = root.querySelector('.request-result');
    const origin = form.elements.origin, lifetime = form.elements.lifetime;
    const checks = form.elements.checks;
    function context() {
      const github = origin.value === 'GitHub PR';
      root.querySelector('.request-command').textContent = github ? '/create dte' : 'Jenkins: Build with Parameters';
      root.querySelector('.request-context p').textContent = github ? 'With the required CI checks passing, the developer requests a DTE in the pull-request conversation. The reply can carry the environment link.' : 'Choose the application versions and lifetime in the Jenkins request. The inspected pipeline exposes deployment and smoke-test feedback.';
      checks.closest('label').hidden = !github;
      lifetime.disabled = github;
      if (github) lifetime.value = 'ephemeral';
      result.innerHTML = '<p>Choose the request inputs, then walk through the path. Changing an input resets the example.</p>';
      root.querySelectorAll('.request-progress li').forEach(li => li.classList.remove('is-complete'));
    }
    origin.addEventListener('change', context);
    lifetime.addEventListener('change', context);
    checks.addEventListener('change', context);
    form.elements.branch.addEventListener('input', context);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (origin.value === 'GitHub PR' && !checks.checked) {
        result.innerHTML = '<p class="visual-warning"><strong>CI checks need attention.</strong> In this walkthrough, resolve the failing checks before requesting the testing environment.</p>';
        return;
      }
      const branch = form.elements.branch.value.trim();
      const normalized = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,42) || 'feature';
      const namespace = `dte-payments-${normalized}`;
      root.querySelectorAll('.request-progress li').forEach(li => li.classList.add('is-complete'));
      const persistent = lifetime.value === 'persistent';
      result.innerHTML = `<p><strong>Walkthrough complete: ready to share.</strong></p><dl><div><dt>Namespace</dt><dd><code>${escape(namespace)}</code></dd></div><div><dt>Preview URL</dt><dd><code>${escape(namespace)}.preview.example.com</code></dd></div><div><dt>Owner</dt><dd>Engineer A</dd></div><div><dt>Lifecycle</dt><dd>${persistent ? 'Persistent: owner-managed cleanup, with reminders' : 'Ephemeral: eligible for nightly expiry cleanup'}</dd></div></dl><p>Smoke-test feedback and deployment details help the developer share this environment in a sprint review.</p>`;
    });
    context();
  }
  function initCleanup(root) {
    const type = root.querySelector('.cleanup-type'), age = root.querySelector('.cleanup-age');
    const render = () => {
      const hours = Number(age.value), old = hours > 6;
      root.querySelector('.cleanup-age-label').textContent = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      const outcome = root.querySelector('.cleanup-outcome');
      outcome.textContent = !old ? 'Keep for now' : type.value === 'ephemeral' ? 'Select for deletion' : 'Remind the owner';
      const detail = !old ? `At ${hours} hours old, this environment is not older than the default cutoff. The nightly job leaves it for a later run.` : type.value === 'ephemeral' ? `At ${hours} hours old, this ephemeral DTE is selected for deletion. The workflow must still verify that namespace deletion finishes.` : `At ${hours} hours old, this persistent DTE receives an owner reminder. The default job does not delete persistent environments.`;
      root.querySelector('.cleanup-detail').textContent = detail;
    };
    age.addEventListener('input', render); type.addEventListener('change', render); render();
  }
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgNode(tag, attrs = {}, text) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key,value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function drawResourceChart(container, env, metric) {
    const width = Math.max(240, container.clientWidth), height = 255;
    const margin = {left:62,right:18,top:26,bottom:46};
    const plot = {w:width-margin.left-margin.right,h:height-margin.top-margin.bottom};
    const memory = metric === 'memory', unit = memory ? 'MiB' : 'cores';
    const usage = memory ? env.memory : env.cpu;
    const request = memory ? env.memRequest : env.cpuRequest;
    const limit = memory ? env.memLimit : env.cpuLimit;
    const samples = [.65,.71,.83,.76,.91,1,.88,.95,.85,.92,1.03,1].map((factor,i) => ({x:i/11*120,y:usage*factor}));
    const top = Math.max(limit,request,...samples.map(d => d.y))*1.12;
    const x = value => margin.left + value/120*plot.w;
    const y = value => margin.top + plot.h - value/top*plot.h;
    const svg = svgNode('svg',{viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':`Sample ${memory ? 'memory' : 'CPU'} usage, requests and limits over two hours for ${env.name}`,class:'resource-chart'});
    svg.append(svgNode('title',{},`Sample ${memory ? 'memory' : 'CPU'} usage, request and limit`));
    svg.append(svgNode('desc',{},'Synthetic observations for an educational dashboard. The dashed request and limit lines remain constant.'));
    svg.append(svgNode('rect',{x:margin.left,y:margin.top,width:plot.w,height:plot.h,class:'chart-frame'}));
    for(let i=0;i<=3;i++) {
      const value=top*i/3;
      svg.append(svgNode('line',{x1:margin.left,y1:y(value),x2:width-margin.right,y2:y(value),class:'chart-grid'}));
      svg.append(svgNode('text',{x:margin.left-9,y:y(value)+4,'text-anchor':'end',class:'chart-label'},memory ? Math.round(value) : value.toFixed(1)));
    }
    [0,60,120].forEach(value => svg.append(svgNode('text',{x:x(value),y:height-24,'text-anchor':value===0?'start':value===120?'end':'middle',class:'chart-label'},value===0?'-2h':value===60?'-1h':'Now')));
    svg.append(svgNode('text',{x:margin.left,y:16,class:'chart-label'},unit));
    svg.append(svgNode('line',{x1:x(0),x2:x(120),y1:y(request),y2:y(request),class:'chart-request'}));
    svg.append(svgNode('line',{x1:x(0),x2:x(120),y1:y(limit),y2:y(limit),class:'chart-limit'}));
    svg.append(svgNode('path',{d:samples.map((point,i) => `${i?'L':'M'} ${x(point.x)} ${y(point.y)}`).join(' '),class:'chart-usage'}));
    svg.append(svgNode('circle',{cx:x(120),cy:y(usage),r:4,class:'chart-point'}));
    container.replaceChildren(svg);
  }
  function initMonitor(root) {
    const data = getConfig(root), body = root.querySelector('.monitor-body'), picker = root.querySelector('.panel-choice');
    const tabs = [...root.querySelectorAll('[data-monitor-view]')];
    let view = 'overview', selected = fixture[0], filter = 'all', metric = 'cpu';
    let chartObserver;
    data.panels.forEach((panel,i) => {const option = document.createElement('option'); option.value=i; option.textContent=`${panel.dashboard}: ${panel.title}`; picker.append(option);});
    const query = () => {
      const panel = data.panels[Number(picker.value)];
      root.querySelector('.panel-explanation').textContent = panel.explanation;
      root.querySelector('.panel-query').textContent = panel.queries.map((q,i) => `# Query ${i+1}\n${q}`).join('\n\n');
    };
    function setView(next) {view=next;render();}
    function render() {
      chartObserver?.disconnect();
      tabs.forEach(tab => tab.setAttribute('aria-pressed',String(tab.dataset.monitorView===view)));
      root.querySelector('.monitor-query').hidden = view !== 'queries';
      if (view === 'queries') {
        body.innerHTML='<p>The exported dashboards used new and legacy namespace-label selectors. Custom colon-named metrics are recording rules whose definitions must exist in the monitoring stack. Select a panel below to inspect its generalized query.</p>';
        query(); return;
      }
      if(view === 'overview') {
        const envs=fixture.filter(e => filter==='all'||e.type===filter);
        const total=envs.reduce((sum,e)=>sum+e.rate,0);
        const owners={};envs.forEach(e=>owners[e.owner]=(owners[e.owner]||0)+e.rate);
        body.innerHTML=`<div class="monitor-stats"><div><span>Active DTEs</span><strong>${envs.length}</strong><small>Sample inventory</small></div><div><span>Hourly allocation</span><strong>${money(total)}</strong><small>Sample USD / hour</small></div><div><span>Need attention</span><strong>${envs.filter(e=>e.ready<e.desired).length}</strong><small>Replica shortfall</small></div></div><div class="owner-cost"><h4>Hourly cost by owner</h4>${Object.entries(owners).map(([owner,cost])=>`<div class="owner-bar-row"><span>${owner}</span><div class="owner-bar-track"><span style="width:${cost/total*100}%"></span></div><strong>${money(cost)} / h</strong></div>`).join('')}</div><label class="visual-label inventory-filter">Environment type<select class="monitor-filter"><option value="all">All types</option><option value="ephemeral">Ephemeral</option><option value="persistent">Persistent</option></select></label><p class="visual-footnote">Select a namespace to explore its resource and application panels.</p><div class="table-scroll"><table><thead><tr><th scope="col">Namespace / owner</th><th scope="col">Lifetime / age</th><th scope="col">Rate</th><th scope="col">Replicas ready</th></tr></thead><tbody>${envs.map(e=>`<tr><td><button type="button" class="environment-link" data-environment="${e.name}">${e.name}</button><small>${e.owner}</small></td><td>${e.type}<small>${e.age} hours</small></td><td>${money(e.rate)} / h</td><td>${e.ready} / ${e.desired}${e.ready<e.desired?' · investigate':''}</td></tr>`).join('')}</tbody></table></div><p class="monitor-selection-note">The actual Overview also provided open-environment, termination, and detail links. This explorer opens a local educational detail view.</p>`;
        const filterInput=body.querySelector('.monitor-filter');filterInput.value=filter;
        filterInput.addEventListener('change',()=>{filter=filterInput.value;render();});
        body.querySelectorAll('[data-environment]').forEach(button=>button.addEventListener('click',()=>{selected=fixture.find(e=>e.name===button.dataset.environment);setView('details');}));
        return;
      }
      body.innerHTML=`<div class="visual-controls"><label class="visual-label">Namespace<select class="environment-choice">${fixture.map(e=>`<option value="${e.name}">${e.name}</option>`).join('')}</select></label><label class="visual-label">Resource chart<select class="metric-choice"><option value="cpu">CPU, cores</option><option value="memory">Memory, MiB</option></select></label></div><p><strong>${selected.owner}</strong> · ${selected.type} · ${selected.age} hours old · ${money(selected.rate)} / h sample rate</p><div class="monitor-chart"></div><div class="chart-legend"><span class="usage-key">Usage</span><span class="request-key">Request</span><span class="limit-key">Limit</span></div><p class="visual-footnote">Synthetic two-hour trend. Raw CPU cores and memory bytes are kept separate from percentage metrics.</p><div class="detail-grid"><div><h4>Deployment readiness</h4><p>${selected.ready} / ${selected.desired} replicas ready</p><p>${selected.ready<selected.desired?'A deployment shortfall needs investigation. Namespace Active does not imply the application is ready.':'The sample shows no replica shortfall. Readiness still does not replace an application smoke test.'}</p></div><div><h4>Puma capacity</h4><p>${selected.workers} workers · ${selected.threads} / ${selected.maxThreads} threads · ${selected.backlog} queued requests</p><p>Worker, thread, and backlog panels connect environment health to application capacity.</p></div><div><h4>Pods and ingress</h4><p>${selected.pods} sample pods · application service</p><code>${selected.name}.preview.example.com</code><p>Internal IPs and original ingress addresses are omitted.</p></div><div><h4>Age-based cost estimate</h4><p>${money(selected.rate)} / h × ${selected.age} h = <strong>${money(selected.rate*selected.age)}</strong></p><p>This assumes a constant rate. The exported age-times-current-rate expression was an estimate, not a historical billing integral.</p></div></div>`;
      const environmentInput=body.querySelector('.environment-choice');environmentInput.value=selected.name;
      environmentInput.addEventListener('change',()=>{selected=fixture.find(e=>e.name===environmentInput.value);render();});
      const metricInput=body.querySelector('.metric-choice');metricInput.value=metric;
      metricInput.addEventListener('change',()=>{metric=metricInput.value;render();});
      const chart=body.querySelector('.monitor-chart');
      chartObserver=new ResizeObserver(()=>drawResourceChart(chart,selected,metric));chartObserver.observe(chart);
      drawResourceChart(chart,selected,metric);
    }
    tabs.forEach(tab=>tab.addEventListener('click',()=>setView(tab.dataset.monitorView)));
    picker.addEventListener('change',query); render(); query();
  }
  const initializers = {flow:initFlow,request:initRequest,cleanup:initCleanup,monitor:initMonitor};
  document.querySelectorAll('[data-visual]').forEach(root => initializers[root.dataset.visual](root));
})();
