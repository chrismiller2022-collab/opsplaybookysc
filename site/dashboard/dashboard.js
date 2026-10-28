// Client Command Center: calculations and charts.
// Ported from the claude.ai Dashboard artifact; the calc bodies are the same
// except that the fixed "as of" time now comes from `dash.asOf`, so the page
// works for both the demo snapshot and a viewer's own CSVs.

const HOUR = 3600e3, DAY = 864e5;
// Timestamps are "YYYY-MM-DD HH:MM" in UTC, as in the demo CSVs.
const parseTs = s => {
  let v = String(s).trim().replace(' ', 'T');
  if (v.length === 16) v += ':00';
  return Date.parse(/(Z|[+-]\d\d:\d\d)$/.test(v) ? v : v + 'Z');
};
const medianOf = xs => {
  if (!xs.length) return null;
  const m = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2;
};

dash.calc('kpis', {
  title: 'Headline numbers',
  inputs: ['requests', 'deadlines'],
  fn: (requests, deadlines) => {
    const now = dash.asOf;
    const open = requests.filter(r => r.status === 'Open');
    const overdue = open.filter(r => now - parseTs(r.received) > 48 * HOUR).length;
    const fr = requests.filter(r => r.hours_to_first_response !== '').map(r => Number(r.hours_to_first_response)).sort((a, b) => a - b);
    const median = medianOf(fr);
    const res = requests.filter(r => r.hours_to_resolve !== '');
    const onTime = res.length ? res.filter(r => Number(r.hours_to_resolve) <= 48).length / res.length : null;
    // Count by calendar day, as the deadlines table does: due today through today + 14.
    const today = Date.parse(new Date(now).toISOString().slice(0, 10) + 'T00:00:00Z');
    const due14 = deadlines.filter(d => { const left = (Date.parse(d.due + 'T00:00:00Z') - today) / DAY; return left >= 0 && left <= 14; }).length;
    const takeaway = overdue > 0
      ? `${overdue} request${overdue === 1 ? '' : 's'} open more than 2 days: clear ${overdue === 1 ? 'it' : 'them'} first, then the ${due14} deadlines due in the next two weeks.`
      : `Nothing overdue; focus on the ${due14} deadlines due in the next two weeks.`;
    return [{
      open: open.length, overdue,
      median_first_hours: median === null ? null : Math.round(median * 10) / 10,
      resolved_on_time: onTime === null ? null : Math.round(onTime * 1000) / 1000,
      due_14_days: due14, takeaway
    }];
  }
});

dash.calc('deadline_days', {
  title: 'Deadlines with days left',
  inputs: ['deadlines'],
  fn: (deadlines) => {
    const today = Date.parse(new Date(dash.asOf).toISOString().slice(0, 10) + 'T00:00:00Z');
    return deadlines.map(d => ({ task: d.task, client: d.client, due: d.due, days_left: Math.round((Date.parse(d.due + 'T00:00:00Z') - today) / DAY) }))
      .filter(d => d.days_left >= 0).sort((a, b) => a.days_left - b.days_left);
  }
});

dash.calc('client_health', {
  title: 'Client health',
  inputs: ['requests', 'clients', 'registrations'],
  fn: (requests, clients, registrations) => {
    const now = dash.asOf;
    return clients.map(c => {
      const mine = requests.filter(r => r.client === c.client);
      const open = mine.filter(r => r.status === 'Open');
      const fr = mine.filter(r => r.hours_to_first_response !== '').map(r => Number(r.hours_to_first_response)).sort((a, b) => a - b);
      const median = medianOf(fr);
      const regs = registrations.filter(r => r.client === c.client && r.this_season !== '').sort((a, b) => Number(b.week_of_registration) - Number(a.week_of_registration));
      const latest = regs[0];
      return {
        client: c.client, platform: c.platform,
        open: open.length,
        overdue: open.filter(r => now - parseTs(r.received) > 48 * HOUR).length,
        median_first_hours: median === null ? null : Math.round(median * 10) / 10,
        reg_pace: latest && Number(latest.last_season) ? Math.round(Number(latest.this_season) / Number(latest.last_season) * 1000) / 1000 : null
      };
    });
  }
});

dash.calc('weekly', {
  title: 'Requests per week',
  inputs: ['requests'],
  fn: (requests) => {
    const counts = {};
    requests.forEach(r => {
      const d = Date.parse(r.received.slice(0, 10) + 'T00:00:00Z');
      const dow = (new Date(d).getUTCDay() + 6) % 7;
      const wk = new Date(d - dow * DAY).toISOString().slice(0, 10);
      counts[wk] = (counts[wk] || 0) + 1;
    });
    return Object.keys(counts).sort().map(week => ({ week, requests: counts[week] }));
  }
});

const countBy = key => rows => {
  const c = {};
  rows.forEach(r => { c[r[key]] = (c[r[key]] || 0) + 1; });
  return Object.keys(c).map(k => ({ [key]: k, requests: c[k] })).sort((a, b) => b.requests - a.requests);
};
dash.calc('by_category', { title: 'Requests by category', inputs: ['requests'], fn: countBy('category') });
dash.calc('by_channel', { title: 'Requests by channel', inputs: ['requests'], fn: countBy('channel') });

(() => {
  const fmtInt = d3.format(',');
  const fmtPct = d3.format('.0%');
  const fmtDay = d => d3.utcFormat('%b %-d')(new Date(d + 'T00:00:00Z'));

  const setMsg = (el, text, bad) => {
    el.innerHTML = '';
    const w = document.createElement('div'); w.className = 'fail';
    if (bad) { const i = document.createElement('i'); w.appendChild(i); }
    w.appendChild(document.createTextNode(text));
    el.appendChild(w);
  };

  const tip = (box) => {
    let t = box.querySelector('.tip');
    if (!t) { t = document.createElement('div'); t.className = 'tip'; box.appendChild(t); }
    return t;
  };
  const showTip = (box, t, ev, label, value) => {
    t.innerHTML = '';
    const a = document.createElement('div'); a.className = 'd'; a.textContent = label; t.appendChild(a);
    const b = document.createElement('div'); b.textContent = value; t.appendChild(b);
    t.style.display = 'block';
    const r = box.getBoundingClientRect();
    let x = ev.clientX - r.left + 12;
    const y = ev.clientY - r.top - 10;
    x = Math.min(x, r.width - t.offsetWidth - 4);
    t.style.left = Math.max(4, x) + 'px'; t.style.top = y + 'px';
  };

  const hbars = (el, rows, keyCol, valCol, color, fmt, refLine) => {
    const W = Math.max(280, el.clientWidth);
    const rowH = 30;
    const svg = d3.select(el).append('svg').attr('width', '100%');
    const probe = svg.append('text').attr('font-size', 12);
    let lw = 0; rows.forEach(r => { probe.text(r[keyCol]); lw = Math.max(lw, probe.node().getComputedTextLength()); });
    probe.text(fmt(d3.max(rows, r => r[valCol]) || 0)); const vw = probe.node().getComputedTextLength();
    probe.remove();
    const m = { l: lw + 12, r: vw + 14, t: 6, b: 6 };
    const H = m.t + m.b + rows.length * rowH;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const maxV = Math.max(d3.max(rows, r => r[valCol]) || 0, refLine || 0);
    const x = d3.scaleLinear([0, maxV * 1.02], [m.l, W - m.r]);
    const y = d3.scaleBand(rows.map(r => r[keyCol]), [m.t, H - m.b]).padding(0.3);
    const t = tip(el);
    rows.forEach(r => {
      const g = svg.append('g');
      g.append('text').attr('x', m.l - 8).attr('y', y(r[keyCol]) + y.bandwidth() / 2 + 4).attr('text-anchor', 'end').attr('font-size', 12).attr('fill', 'var(--color-fg)').text(r[keyCol]);
      const c = typeof color === 'function' ? color(r) : color;
      g.append('rect').attr('x', m.l).attr('y', y(r[keyCol])).attr('height', Math.min(y.bandwidth(), 22)).attr('width', Math.max(2, x(r[valCol]) - m.l)).attr('rx', 4).attr('fill', c)
        .on('mousemove', ev => showTip(el, t, ev, r[keyCol], fmt(r[valCol]))).on('mouseleave', () => { t.style.display = 'none'; });
      g.append('text').attr('x', x(r[valCol]) + 6).attr('y', y(r[keyCol]) + y.bandwidth() / 2 + 4).attr('font-size', 12).attr('fill', 'var(--color-fg-muted)').text(fmt(r[valCol]));
    });
    if (refLine) svg.append('line').attr('x1', x(refLine)).attr('x2', x(refLine)).attr('y1', m.t - 2).attr('y2', H - m.b + 2).attr('stroke', 'var(--chart-reference)').attr('stroke-dasharray', '4 3');
    el.style.minHeight = H + 'px';
  };

  // Clear a chart box and show a message when its data isn't ready.
  const prep = (el, d) => {
    d3.select(el).selectAll('svg,.fail').remove();
    if (d.status === 'ok') return true;
    if (d.status === 'loading') setMsg(el, 'Loading…');
    else setMsg(el, d.message || 'Failed to load', true);
    return false;
  };

  dash.onData(() => {
    // KPIs
    const k = dash.data('kpis');
    const tiles = document.querySelectorAll('#kpis .num');
    const take = document.getElementById('takeaway');
    if (k.status === 'ok' && k.data.length) {
      const r = k.data[0];
      tiles[0].textContent = fmtInt(r.open);
      tiles[1].textContent = fmtInt(r.overdue);
      tiles[1].classList.toggle('bad', r.overdue > 0);
      tiles[2].textContent = r.median_first_hours === null ? '—' : d3.format('.1f')(r.median_first_hours);
      tiles[2].classList.toggle('ok', r.median_first_hours !== null && r.median_first_hours < 4);
      tiles[3].textContent = r.resolved_on_time === null ? '—' : d3.format('.1%')(r.resolved_on_time);
      tiles[3].classList.toggle('bad', r.resolved_on_time !== null && r.resolved_on_time < 0.95);
      tiles[4].textContent = fmtInt(r.due_14_days);
      take.textContent = r.takeaway;
    } else {
      tiles.forEach(n => { n.textContent = '—'; n.classList.remove('bad', 'ok'); });
      take.textContent = k.status === 'loading' ? 'Loading…' : (k.message || '—');
    }

    // Deadlines table
    const dl = dash.data('deadline_days');
    const dBody = document.querySelector('#deadlines tbody');
    dBody.innerHTML = '';
    if (dl.status === 'ok') {
      dl.data.forEach(r => {
        const tr = document.createElement('tr');
        const cells = [fmtDay(r.due), String(r.days_left), r.client, r.task];
        cells.forEach((v, i) => { const td = document.createElement('td'); td.textContent = v; if (i === 1) { td.className = 'r'; if (r.days_left <= 3) td.classList.add('bad'); } tr.appendChild(td); });
        dBody.appendChild(tr);
      });
    }

    // Health table
    const h = dash.data('client_health');
    const hBody = document.querySelector('#health tbody');
    hBody.innerHTML = '';
    if (h.status === 'ok') {
      h.data.forEach(r => {
        const tr = document.createElement('tr');
        const cells = [r.client, r.platform, fmtInt(r.open), fmtInt(r.overdue), r.median_first_hours === null ? '—' : d3.format('.1f')(r.median_first_hours), r.reg_pace === null ? '—' : fmtPct(r.reg_pace)];
        cells.forEach((v, i) => {
          const td = document.createElement('td'); td.textContent = v;
          if (i >= 2) td.className = 'r';
          if (i === 3 && r.overdue > 0) td.classList.add('bad');
          if (i === 5 && r.reg_pace !== null) td.classList.add(r.reg_pace < 0.95 ? 'bad' : 'ok');
          tr.appendChild(td);
        });
        hBody.appendChild(tr);
      });
    }

    // Weekly bars
    const wEl = document.getElementById('weekly');
    const w = dash.data('weekly');
    if (prep(wEl, w) && w.data.length) {
      const rows = w.data;
      const W = Math.max(280, wEl.clientWidth), H = 220, m = { l: 34, r: 8, t: 10, b: 26 };
      const svg = d3.select(wEl).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
      const x = d3.scaleBand(rows.map(r => r.week), [m.l, W - m.r]).padding(0.25);
      const y = d3.scaleLinear([0, d3.max(rows, r => r.requests) * 1.1], [H - m.b, m.t]);
      svg.append('g').selectAll('line').data(y.ticks(4)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', 'var(--chart-grid)');
      svg.append('g').selectAll('text').data(y.ticks(4)).join('text').attr('x', m.l - 6).attr('y', d => y(d) + 4).attr('text-anchor', 'end').attr('font-size', 11).attr('fill', 'var(--color-fg-muted)').text(d => d);
      const t = tip(wEl);
      const last = rows.at(-1).week;
      svg.append('g').selectAll('rect').data(rows).join('rect')
        .attr('x', r => x(r.week) + Math.max(0, (x.bandwidth() - 32) / 2)).attr('width', Math.min(32, x.bandwidth()))
        .attr('y', r => y(r.requests)).attr('height', r => y(0) - y(r.requests)).attr('rx', 4)
        .attr('fill', r => r.week === last ? 'var(--chart-muted)' : dash.colors[0])
        .on('mousemove', (ev, r) => showTip(wEl, t, ev, 'Week of ' + fmtDay(r.week) + (r.week === last ? ' (partial)' : ''), fmtInt(r.requests) + ' requests'))
        .on('mouseleave', () => { t.style.display = 'none'; });
      const every = Math.ceil(rows.length / Math.max(1, Math.floor((W - m.l) / 56)));
      svg.append('g').selectAll('text').data(rows.filter((_, i) => i % every === 0)).join('text')
        .attr('x', r => x(r.week) + x.bandwidth() / 2).attr('y', H - 8).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', 'var(--color-fg-muted)').text(r => fmtDay(r.week));
      svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', 'var(--chart-axis)');
    }

    // Pace bars
    const pEl = document.getElementById('pace');
    if (prep(pEl, h)) {
      const rows = h.data.filter(r => r.reg_pace !== null).slice().sort((a, b) => a.reg_pace - b.reg_pace);
      hbars(pEl, rows, 'client', 'reg_pace', r => r.reg_pace < 0.95 ? 'var(--chart-critical)' : dash.colors[0], fmtPct, 1);
    }

    // Categories and channels
    [['cats', 'by_category', 'category'], ['chans', 'by_channel', 'channel']].forEach(([id, src, key]) => {
      const el = document.getElementById(id);
      const d = dash.data(src);
      if (prep(el, d)) hbars(el, d.data, key, 'requests', dash.colors[0], fmtInt, null);
    });
  });
})();

// Data sources: the demo snapshot, or CSVs the viewer picks (read in the
// browser only; nothing is uploaded anywhere).
(() => {
  const DEMO_AS_OF = Date.parse('2026-10-13T17:00:00Z');
  const asOfNote = document.getElementById('asof');
  const status = document.getElementById('source-status');
  const picker = document.getElementById('csv-picker');
  const fmtAsOf = t => new Date(t).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  const loadDemo = async () => {
    dash.setLoading();
    const tables = {};
    await Promise.all(dash.DATASETS.map(async id => {
      try {
        const res = await fetch(`/data/${id}.csv`, { cache: 'no-cache' });
        if (res.ok) tables[id] = await res.text();
      } catch (e) { /* reported as missing below */ }
    }));
    dash.load(tables, DEMO_AS_OF);
    asOfNote.textContent = `Demo with invented data for five fictional clubs, as of ${fmtAsOf(DEMO_AS_OF)}.`;
    status.textContent = 'Showing demo data.';
  };

  picker.addEventListener('change', async () => {
    const files = Array.from(picker.files || []);
    if (!files.length) return;
    const tables = {};
    for (const f of files) {
      const id = dash.DATASETS.find(d => f.name.toLowerCase().startsWith(d));
      if (id) tables[id] = await f.text();
    }
    const missing = dash.DATASETS.filter(d => !(d in tables));
    const now = Date.now();
    dash.load(tables, now);
    asOfNote.textContent = `Your data, as of ${fmtAsOf(now)} UTC. It stays in this browser tab and is never uploaded.`;
    status.textContent = missing.length
      ? `Loaded ${files.length} file(s). Missing: ${missing.map(m => m + '.csv').join(', ')}.`
      : 'Showing your files.';
    picker.value = '';
  });

  document.getElementById('use-demo').addEventListener('click', loadDemo);
  loadDemo();
})();
