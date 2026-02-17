import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://date.nager.at/api/v3";

const monthLabelsSR = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("sr-RS", { month: "long" })
);

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoDate(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

// vraca niz "celija" za grid (42 polja = 6 nedelja * 7 dana), sa null za prazna polja
function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // JS: 0=ned,1=pon... Mi hocemo da pon bude prvi -> mapiranje:
  const jsDay = first.getDay(); // 0..6
  const startOffset = (jsDay + 6) % 7; // pon=0, uto=1... ned=6

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  return cells;
}

export default function Holidays() {
  const now = new Date();
  const [countryCode, setCountryCode] = useState("RS");
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // fetch praznika za (year, countryCode)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const cc = (countryCode || "").trim().toUpperCase();
        if (cc.length !== 2) {
          setHolidays([]);
          setError("Unesi dvoslovni ISO kod države (npr. RS).");
          setLoading(false);
          return;
        }

        const url = `${API_BASE}/PublicHolidays/${year}/${cc}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`API greška (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) setHolidays(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setHolidays([]);
          setError(e?.message || "Neuspešno učitavanje praznika.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [countryCode, year]);

  // mapa: "YYYY-MM-DD" -> [holiday, holiday...]
  const holidaysByDate = useMemo(() => {
    const map = new Map();
    for (const h of holidays) {
      const key = h.date; // vec je YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h);
    }
    return map;
  }, [holidays]);

  const gridCells = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);

  const holidaysThisMonth = useMemo(() => {
    const m = monthIndex + 1;
    const prefix = `${year}-${pad2(m)}-`;
    return holidays
      .filter((h) => typeof h.date === "string" && h.date.startsWith(prefix))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [holidays, year, monthIndex]);

  const weekDays = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

  return (
    <div className="hc-page">
      <h2 className="hc-title">Holiday calendar (Nager.Date)</h2>

      <div className="hc-controls">
        <label className="hc-field">
          Država (ISO):
          <input
            className="hc-input"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            placeholder="RS"
            maxLength={2}
          />
        </label>

        <label className="hc-field">
          Godina:
          <input
            className="hc-input"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value || now.getFullYear()))}
            min={1900}
            max={2100}
          />
        </label>

        <label className="hc-field">
          Mesec:
          <select
            className="hc-input"
            value={monthIndex}
            onChange={(e) => setMonthIndex(Number(e.target.value))}
          >
            {monthLabelsSR.map((m, idx) => (
              <option value={idx} key={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <div className="hc-info">Učitavanje praznika…</div>}
      {error && <div className="hc-error">⚠ {error}</div>}

      <div className="hc-calendar">
        <div className="hc-weekdays">
          {weekDays.map((d) => (
            <div key={d} className="hc-weekday">
              {d}
            </div>
          ))}
        </div>

        <div className="hc-grid">
          {gridCells.map((day, idx) => {
            if (!day) return <div key={idx} className="hc-cell hc-empty" />;

            const key = isoDate(year, monthIndex, day);
            const dayHolidays = holidaysByDate.get(key) || [];
            const isHoliday = dayHolidays.length > 0;

            const tooltip = isHoliday
              ? dayHolidays.map((h) => `${h.localName || h.name} (${(h.types || []).join(", ")})`).join(" • ")
              : "";

            return (
              <div
                key={idx}
                className={`hc-cell ${isHoliday ? "hc-holiday" : ""}`}
                title={tooltip}
              >
                <div className="hc-daynum">{day}</div>
                {isHoliday && <div className="hc-badge">P</div>}
              </div>
            );
          })}
        </div>
      </div>

      <h3 className="hc-subtitle">Praznici u izabranom mesecu</h3>
      {holidaysThisMonth.length === 0 ? (
        <div className="hc-info">Nema praznika u ovom mesecu (ili još nisu učitani).</div>
      ) : (
        <ul className="hc-list">
          {holidaysThisMonth.map((h) => (
            <li key={`${h.date}-${h.localName}-${h.name}`} className="hc-listitem">
              <b>{h.date}</b> — {h.localName || h.name}
              {h.types?.length ? <span className="hc-muted"> ({h.types.join(", ")})</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
