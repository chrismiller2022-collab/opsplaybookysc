// A small stand-in for the claude.ai Dashboard runtime, so the command
// center runs as a plain static page. It provides the same `dash.data`,
// `dash.calc`, `dash.onData` and `dash.colors` API the artifact used.
(() => {
  const DATASETS = ['clients', 'deadlines', 'registrations', 'requests'];
  const raw = {};        // dataset id -> { status, data, columns, message }
  const calcs = {};      // calc id -> { inputs, fn, title, description }
  const listeners = [];
  let calcCache = {};

  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const dash = {
    // Reference time for "open over 2 days", "days left" and so on.
    asOf: null,

    get colors() { return [css('--chart-1')]; },

    calc(id, def) { calcs[id] = def; },

    data(id) {
      if (raw[id]) return raw[id];
      if (calcs[id]) {
        if (calcCache[id]) return calcCache[id];
        const ins = calcs[id].inputs.map(i => dash.data(i));
        const notOk = ins.find(d => d.status !== 'ok');
        if (notOk) return { status: notOk.status, data: [], message: notOk.message };
        let out;
        try {
          out = { status: 'ok', data: calcs[id].fn(...ins.map(d => d.data)) };
        } catch (e) {
          console.error(`calc ${id} failed`, e);
          out = { status: 'error', data: [], message: String(e.message || e) };
        }
        calcCache[id] = out;
        return out;
      }
      return { status: 'missing', data: [] };
    },

    onData(fn) { listeners.push(fn); fn(); },

    redraw() { listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); },

    // Replace every dataset at once. `tables` maps dataset id -> CSV text.
    load(tables, asOf) {
      dash.asOf = asOf;
      calcCache = {};
      DATASETS.forEach(id => {
        const text = tables[id];
        if (text == null) { raw[id] = { status: 'missing', data: [], message: `No ${id}.csv loaded` }; return; }
        try {
          const rows = d3.csvParse(text.replace(/^﻿/, ''));
          raw[id] = { status: 'ok', data: Array.from(rows), columns: rows.columns };
        } catch (e) {
          raw[id] = { status: 'error', data: [], message: String(e.message || e) };
        }
      });
      dash.redraw();
    },

    setLoading() {
      calcCache = {};
      DATASETS.forEach(id => { raw[id] = { status: 'loading', data: [] }; });
      dash.redraw();
    },

    DATASETS
  };

  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(dash.redraw, 120); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => dash.redraw());

  window.dash = dash;
})();
