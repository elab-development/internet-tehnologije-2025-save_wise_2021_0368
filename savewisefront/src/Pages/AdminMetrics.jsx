import React, { useEffect, useMemo, useState } from "react";
import { Chart } from "react-google-charts";

const BASE_URL = "http://127.0.0.1:8000/api";

export default function AdminMetrics({ token }) {
  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [colors, setColors] = useState({ green: "#16a34a", navy: "#0b1f3a" });

  useEffect(() => {
    // pokupi boje iz App.css varijabli
    const cs = getComputedStyle(document.documentElement);
    const green = (cs.getPropertyValue("--green") || "#16a34a").trim();
    const navy = (cs.getPropertyValue("--navy") || "#0b1f3a").trim();
    setColors({ green, navy });
  }, []);

  const readErrorMessage = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      if (res.status === 401) return "Unauthorized. Please login again.";
      if (res.status === 403) return "Forbidden (admin only).";
      return "Something went wrong. Please try again later.";
    }
    const body = await res.json().catch(() => null);
    return body?.message || "Something went wrong.";
  };

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/admin/metrics`, {
        method: "GET",
        headers: authHeaders,
      });
      if (!res.ok) {
        setError(await readErrorMessage(res));
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Network error. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  const nf = useMemo(() => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }), []);

  const pieOptions = useMemo(() => ({
    legend: { position: "bottom" },
    pieHole: 0.45,
    chartArea: { width: "92%", height: "80%" },
    colors: [colors.green, colors.navy],
    backgroundColor: "transparent",
  }), [colors]);

  const barOptions = useMemo(() => ({
    legend: { position: "none" },
    chartArea: { width: "85%", height: "70%" },
    colors: [colors.green],
    backgroundColor: "transparent",
    vAxis: { minValue: 0 },
  }), [colors]);

  return (
    <div className="page">
      <div>
        <h2>Admin Metrics</h2>
        <p>Simple overview for year {data?.year || 2026}</p>

        <hr />

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "crimson", fontWeight: 700 }}>{error}</p>}

        {data && (
          <>
            {/* KPI cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-kpi">{nf.format(data.cards.users)}</div>
                <div className="metric-label">Total users</div>
              </div>

              <div className="metric-card">
                <div className="metric-kpi">{nf.format(data.cards.transactions)}</div>
                <div className="metric-label">Transactions (2026)</div>
              </div>

              <div className="metric-card">
                <div className="metric-kpi">{nf.format(data.cards.net)}</div>
                <div className="metric-label">Net (income - expense)</div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Expenses by month</h3>
                <Chart
                  chartType="ColumnChart"
                  width="100%"
                  height="320px"
                  data={data.charts.bar_expenses_by_month}
                  options={barOptions}
                />
              </div>

              <div className="card">
                <h3 style={{ marginTop: 0 }}>Income vs Expense</h3>
                <Chart
                  chartType="PieChart"
                  width="100%"
                  height="320px"
                  data={data.charts.pie_type}
                  options={pieOptions}
                />
              </div>
            </div>

            {/* Bonus list (bez dodatnih grafika) */}
            <div className="card" style={{ marginTop: 14 }}>
              <h3 style={{ marginTop: 0 }}>Top categories (expense)</h3>
              {(!data.top_categories || data.top_categories.length === 0) ? (
                <p>No data.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {data.top_categories.map((x, idx) => (
                    <li key={idx}>
                      <strong>{x.category}:</strong> {nf.format(x.expense)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
