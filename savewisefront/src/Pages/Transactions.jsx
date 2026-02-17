import React, { useEffect, useMemo, useState } from "react";
import ReusableTable from "../Components/ReusableTable";

// Nas backend (Laravel)
const BASE_URL = "http://127.0.0.1:8000/api";

export default function Transactions({ user, token }) {
  // Bearer token headers za zaštićene rute
  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const nf = useMemo(
    () => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }),
    []
  );

  // osnovni podaci
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // statovi za formu
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [form, setForm] = useState({
    id: null,
    account_id: "",
    category_id: "",
    type: "expense",
    amount: "",
    date: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [displayCurrency, setDisplayCurrency] = useState("ORIGINAL"); // ORIGINAL | RSD | EUR
  const [eurRateRsd, setEurRateRsd] = useState(null); // 1 EUR = X RSD (middle kurs)
  const [eurRateDate, setEurRateDate] = useState(null);
  const [fxInfo, setFxInfo] = useState("");

  // Mapovi radi lakšeg prikaza u tabeli
  const accountById = useMemo(() => {
    const map = new Map();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const categoryById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // pomocno za citanje error poruka
  const readErrorMessage = async (res) => {
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      if (res.status === 401) return "Unauthorized. Please login again.";
      if (res.status === 403) return "Forbidden.";
      if (res.status === 422) return "Please check your input.";
      return "Something went wrong. Please try again later.";
    }

    const data = await res.json().catch(() => null);

    if (data?.message) return data.message;

    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      const firstMsg = data.errors[firstKey]?.[0];
      if (firstMsg) return firstMsg;
    }

    return "Something went wrong. Please try again later.";
  };

  // vracanje naloga i kategorija
  const fetchAccounts = async () => {
    const res = await fetch(`${BASE_URL}/accounts`, {
      method: "GET",
      headers: authHeaders,
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    const data = await res.json();
    setAccounts(data?.data || []);
  };

  const fetchCategories = async () => {
    const res = await fetch(`${BASE_URL}/categories`, { method: "GET" });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : data?.data || []);
  };

  // Backend vraća paginaciju, pa mi automatski povučemo sve strane
  const fetchAllTransactions = async () => {
    const all = [];
    let page = 1;
    const perPage = 100; // backend max 100 (po validaciji)

    while (true) {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage));

      const res = await fetch(`${BASE_URL}/transactions?${params.toString()}`, {
        method: "GET",
        headers: authHeaders,
      });

      if (!res.ok) throw new Error(await readErrorMessage(res));

      const json = await res.json();
      const batch = json?.data || [];
      all.push(...batch);

      const current = json?.meta?.current_page || page;
      const last = json?.meta?.last_page || page;

      if (current >= last) break;
      page += 1;
    }

    setTransactions(all);
  };

  // NE zovemo direktno kurs.resenje.org iz browsera,
  // nego zovemo naš backend: /api/fx/kurs/eur (sa tokenom)

  const fetchEurRateFromBackend = async () => {
    setFxInfo("");

    // Ako korisnik želi ORIGINAL prikaz, FX nam ni ne treba
    if (displayCurrency === "ORIGINAL") return;

    // Ako već imamo kurs, ne ponavljamo poziv
    if (eurRateRsd) return;

    const res = await fetch(`${BASE_URL}/fx/kurs/eur`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      setFxInfo("FX unavailable (backend proxy failed).");
      return;
    }

    const json = await res.json();
    // očekujemo: middle = RSD za 1 EUR
    const middle = Number(json?.middle);

    if (!Number.isFinite(middle) || middle <= 0) {
      setFxInfo("FX unavailable (invalid rate).");
      return;
    }

    setEurRateRsd(middle);
    setEurRateDate(json?.date || null);
  };

  // konverzija, samo vizuelno, ne u bazi
  const convert = (amount, fromCurrency) => {
    const a = Number(amount);
    const from = String(fromCurrency || "RSD").toUpperCase();

    if (!Number.isFinite(a)) return { ok: false, value: a, currency: from };

    if (displayCurrency === "ORIGINAL") {
      return { ok: true, value: a, currency: from };
    }

    const to = String(displayCurrency).toUpperCase();

    // ako su iste valute, nema konverzije
    if (from === to) return { ok: true, value: a, currency: to };

    // radimo samo RSD <-> EUR 
    if (!eurRateRsd) return { ok: false, value: a, currency: from };

    if (from === "RSD" && to === "EUR") {
      return { ok: true, value: a / eurRateRsd, currency: "EUR" };
    }

    if (from === "EUR" && to === "RSD") {
      return { ok: true, value: a * eurRateRsd, currency: "RSD" };
    }

    // sve ostalo: ne konvertujemo
    return { ok: false, value: a, currency: from };
  };

  // ucitavanje sve za acconuts, categories i transakcije
  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([fetchAccounts(), fetchCategories()]);
      await fetchAllTransactions();
    } catch (e) {
      setError(e?.message || "Network error.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // kada se korisnik uloguje / token promeni
    loadAll();
    // reset FX cache kad se promeni korisnik 
    setEurRateRsd(null);
    setEurRateDate(null);
  }, [token]);

  // kad korisnik izabere valutu prikaza, pokušaj da povučeš kurs
  useEffect(() => {
    fetchEurRateFromBackend();
  }, [displayCurrency]);

  // helperi za formatiranje datuma
  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  const toDatetimeLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  };

  // Form actions
  const resetForm = () => {
    setMode("create");
    setForm({
      id: null,
      account_id: "",
      category_id: "",
      type: "expense",
      amount: "",
      date: "",
      description: "",
    });
    setFormError("");
    setFormSuccess("");
  };

  const startEdit = (tx) => {
    setMode("edit");
    setFormError("");
    setFormSuccess("");

    setForm({
      id: tx.id,
      account_id: tx.account_id,
      category_id: tx.category_id,
      type: tx.type || "expense",
      amount: tx.amount ?? "",
      date: toDatetimeLocal(tx.date),
      description: tx.description ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      // minimalna FE validacija
      if (!form.category_id || !form.amount || !form.date || !form.type) {
        setFormError("Please fill required fields.");
        return;
      }
      if (mode === "create" && !form.account_id) {
        setFormError("Please select account.");
        return;
      }

      const payloadCreate = {
        account_id: Number(form.account_id),
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        date: form.date,
        description: form.description || null,
        type: form.type,
      };

      const payloadUpdate = {
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        date: form.date,
        description: form.description || null,
        type: form.type,
      };

      const url =
        mode === "create"
          ? `${BASE_URL}/transactions`
          : `${BASE_URL}/transactions/${form.id}`;

      const method = mode === "create" ? "POST" : "PUT";
      const body = mode === "create" ? payloadCreate : payloadUpdate;

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setFormError(await readErrorMessage(res));
        return;
      }

      setFormSuccess(mode === "create" ? "Transaction created." : "Transaction updated.");

      // refresh list
      await fetchAllTransactions();

      if (mode === "create") resetForm();
    } catch (err) {
      setFormError(err?.message || "Network error.");
    }
  };

  const remove = async (tx) => {
    const ok = window.confirm("Delete this transaction?");
    if (!ok) return;

    setError("");
    try {
      const res = await fetch(`${BASE_URL}/transactions/${tx.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }

      await fetchAllTransactions();
    } catch {
      setError("Network error. Please try again.");
    }
  };

  // kolone za reusable tabelu
  const columns = useMemo(() => {
    return [
      { header: "Date", accessor: "date", render: (row) => formatDate(row.date) },
      { header: "Type", accessor: "type", render: (row) => row.type },

      {
        header: "Account",
        accessor: "account_id",
        render: (row) => {
          const acc = accountById.get(row.account_id);
          return acc ? `${acc.name} (${acc.currency})` : row.account_id;
        },
      },

      {
        header: "Category",
        accessor: "category_id",
        render: (row) => categoryById.get(row.category_id)?.name || row.category_id,
      },

      {
        header: "Amount",
        accessor: "amount",
        render: (row) => {
          const acc = accountById.get(row.account_id);
          const fromCur = String(acc?.currency || "RSD").toUpperCase();

          const conv = convert(row.amount, fromCur);

          // ako korisnik izabere RSD/EUR i imamo kurs, prikažemo konvertovan iznos + original u zagradi
          if (displayCurrency !== "ORIGINAL" && conv.ok) {
            return (
              <div>
                <div style={{ fontWeight: 900 }}>
                  {nf.format(conv.value)} {conv.currency}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  ({nf.format(Number(row.amount))} {fromCur})
                </div>
              </div>
            );
          }

          // fallback: original
          return (
            <div>
              <div style={{ fontWeight: 900 }}>
                {nf.format(Number(row.amount))} {fromCur}
              </div>
              {displayCurrency !== "ORIGINAL" && (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>FX n/a</div>
              )}
            </div>
          );
        },
      },

      {
        header: "Actions",
        accessor: "_actions",
        render: (row) => (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => startEdit(row)}>
              Edit
            </button>
            <button type="button" onClick={() => remove(row)}>
              Delete
            </button>
          </div>
        ),
      },
    ];
  }, [accountById, categoryById, displayCurrency, eurRateRsd, nf]);

  //sta se prikazuje na stranici
  return (
    <div className="page">
      <div>
        <h2>Transactions</h2>
        <p style={{ marginTop: 6 }}>
          CRUD transakcija + <strong>vizuelna</strong> konverzija valute (RSD ↔ EUR).
        </p>

        <hr />

        {/* FX control (vizuelno) */}
        <div className="filters-bar">
          <label style={{ fontWeight: 900, color: "var(--navy)" }}>Display currency:</label>

          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="ORIGINAL">Original (account currency)</option>
            <option value="RSD">RSD</option>
            <option value="EUR">EUR</option>
          </select>

          {/* Info o kursu (preko backend proxy poziva) */}
          {displayCurrency !== "ORIGINAL" && eurRateRsd && (
            <span style={{ color: "var(--muted)", fontWeight: 700 }}>
              1 EUR = {nf.format(eurRateRsd)} RSD {eurRateDate ? `(date: ${eurRateDate})` : ""}
            </span>
          )}

          {fxInfo && <span style={{ color: "var(--muted)", fontWeight: 700 }}>{fxInfo}</span>}
        </div>

        {/* Forma: Create/Edit */}
        <div className="card" style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>{mode === "create" ? "Add transaction" : "Edit transaction"}</h3>
            {mode === "edit" && (
              <button type="button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={submit} style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {formError && <p style={{ color: "crimson", fontWeight: 700 }}>{formError}</p>}
            {formSuccess && (
              <p
                style={{
                  background: "rgba(34,197,94,0.10)",
                  border: "1px solid rgba(34,197,94,0.18)",
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                {formSuccess}
              </p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>Account {mode === "create" ? "*" : "(locked)"}</label>
                <select
                  value={form.account_id}
                  onChange={(e) => setForm((p) => ({ ...p, account_id: e.target.value }))}
                  disabled={mode === "edit"}
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Category *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Type *</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                  <option value="expense">expense</option>
                  <option value="income">income</option>
                </select>
              </div>

              <div>
                <label>Amount * (in account currency)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>

              <div>
                <label>Date *</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>

              <div>
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="submit">{mode === "create" ? "Create" : "Save changes"}</button>
            </div>
          </form>
        </div>

        <hr />

        {/* Lista transakcija */}
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "crimson", fontWeight: 700 }}>{error}</p>}

        <ReusableTable columns={columns} data={transactions} />

      </div>
    </div>
  );
}
