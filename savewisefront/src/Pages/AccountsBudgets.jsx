import React, { useEffect, useMemo, useState } from "react";
import ReusableTable from "../Components/ReusableTable";

const BASE_URL = "http://127.0.0.1:8000/api";

//meseci za budzete
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AccountsBudgets = ({ token }) => {
  // helper za rute - gde se token prosledjuje
  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  //tipovi povratnih poruka
  const readErrorMessage = async (res) => {
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      if (res.status === 401) return "Unauthorized. Please login again.";
      if (res.status === 422) return "Please check your input and try again.";
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

  // sve za naloge
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");

  // sve za budzete
  const [budgets, setBudgets] = useState([]);
  const [budgetsMeta, setBudgetsMeta] = useState(null);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [budgetsError, setBudgetsError] = useState("");

  // filteri koje cemo koristiti
  const [filterType, setFilterType] = useState({
    month: "",
    year: "",
    categoryName: "",
    page: 1,
  });

  // za vracanje kategorija za budzete
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");

  // modali za prikazivanje
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showBudgetCreateModal, setShowBudgetCreateModal] = useState(false);
  const [showBudgetEditModal, setShowBudgetEditModal] = useState(false);

  // forme za prikazivanje
  const [accountForm, setAccountForm] = useState({
    name: "",
    initial_balance: "",
    currency: "RSD",
  });
  const [accountFormError, setAccountFormError] = useState("");
  const [accountFormSuccess, setAccountFormSuccess] = useState("");

  const [budgetCreateForm, setBudgetCreateForm] = useState({
    category_id: "",
    name: "",
    month: "",
    year: "",
    planned_amount: "",
  });
  const [budgetCreateError, setBudgetCreateError] = useState("");
  const [budgetCreateSuccess, setBudgetCreateSuccess] = useState("");

  const [budgetEditForm, setBudgetEditForm] = useState({
    id: null,
    name: "",
    month: "",
    year: "",
    planned_amount: "",
  });
  const [budgetEditError, setBudgetEditError] = useState("");
  const [budgetEditSuccess, setBudgetEditSuccess] = useState("");

  //vracanje naloga iz baze
  const fetchAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError("");

    try {
      const res = await fetch(`${BASE_URL}/accounts`, {
        method: "GET",
        headers: authHeaders,
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setAccountsError(msg);
        setAccounts([]);
        return;
      }

      const data = await res.json();
      setAccounts(data?.data || []);
    } catch (e) {
      setAccountsError("Network error. Please try again.");
    } finally {
      setAccountsLoading(false);
    }
  };

  //vracanje kategorija iz baze
  const fetchCategories = async () => {
    setCategoriesError("");

    try {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: "GET"
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setCategoriesError(msg);
        setCategories([]);
        return;
      }

      //odgovor koji dobijamo, da moze u formatu
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (data?.data || []));
      
    } catch (e) {
      setCategoriesError("Network error. Please try again.");
    }
  };

  // vracanje budzeta i filtera sa backenda
  const fetchBudgets = async (nextState = null) => {
    const st = nextState || filterType;

    setBudgetsLoading(true);
    setBudgetsError("");

    try {
      const params = new URLSearchParams();
      params.set("per_page", "6");
      params.set("page", String(st.page || 1));

      if (st.month) params.set("month", String(st.month));
      if (st.year) params.set("year", String(st.year));
      if (st.categoryName) params.set("category_name", st.categoryName);

      const res = await fetch(`${BASE_URL}/budgets?${params.toString()}`, {
        method: "GET",
        headers: authHeaders,
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setBudgetsError(msg);
        setBudgets([]);
        setBudgetsMeta(null);
        return;
      }

      const data = await res.json();
      setBudgets(data?.data || []);
      setBudgetsMeta(data?.meta || null);
    } catch (e) {
      setBudgetsError("Network error. Please try again.");
    } finally {
      setBudgetsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchBudgets();
  }, [token]);

  // kreiranje naloga 
  const createAccount = async (e) => {
    e.preventDefault();
    setAccountFormError("");
    setAccountFormSuccess("");

    try {
      const payload = {
        name: accountForm.name,
        initial_balance: Number(accountForm.initial_balance),
        currency: accountForm.currency,
      };

      const res = await fetch(`${BASE_URL}/accounts`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setAccountFormError(msg);
        return;
      }

      setAccountFormSuccess("Account created.");
      setAccountForm({ name: "", initial_balance: "", currency: "RSD" });
      setShowAccountModal(false);
      fetchAccounts();
    } catch (e2) {
      setAccountFormError("Network error. Please try again.");
    }
  };

  // kreiranje budzeta
  const autoBudgetName = (categoryId, month, year) => {
    const cat = categories.find((c) => String(c.id) === String(categoryId));
    const catName = cat?.name || "Category";
    const monthLabel = month ? monthNames[Number(month) - 1] : "Month";
    const yearLabel = year || "Year";
    return `Budget for ${catName} - ${monthLabel} ${yearLabel}`;
  };

  const onBudgetCreateChange = (key, value) => {
    setBudgetCreateForm((prev) => {
      const next = { ...prev, [key]: value };

      // Auto name ako je prazno ili ako korisnik nije kucao custom
      const shouldAuto =
        !prev.name ||
        prev.name === autoBudgetName(prev.category_id, prev.month, prev.year);

      if (shouldAuto) {
        next.name = autoBudgetName(next.category_id, next.month, next.year);
      }

      return next;
    });
  };

  const createBudget = async (e) => {
    e.preventDefault();
    setBudgetCreateError("");
    setBudgetCreateSuccess("");

    try {
      const payload = {
        category_id: Number(budgetCreateForm.category_id),
        name: budgetCreateForm.name,
        month: Number(budgetCreateForm.month),
        year: Number(budgetCreateForm.year),
        planned_amount: Number(budgetCreateForm.planned_amount),
      };

      const res = await fetch(`${BASE_URL}/budgets`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setBudgetCreateError(msg);
        return;
      }

      setBudgetCreateSuccess("Budget created.");
      setShowBudgetCreateModal(false);
      setBudgetCreateForm({
        category_id: "",
        name: "",
        month: "",
        year: "",
        planned_amount: "",
      });

      // refreshovanje budzeta da se ode na prvu stranicu
      const next = { ...filterType, page: 1 };
      setFilterType(next);
      fetchBudgets(next);
    } catch (e2) {
      setBudgetCreateError("Network error. Please try again.");
    }
  };

  // editovanje budzeta
  const openEditBudget = (b) => {
    setBudgetEditError("");
    setBudgetEditSuccess("");
    setBudgetEditForm({
      id: b.id,
      name: b.name || "",
      month: b.month || "",
      year: b.year || "",
      planned_amount: b.planned_amount ?? "",
    });
    setShowBudgetEditModal(true);
  };

  //azuriranje budzeta
  const updateBudget = async (e) => {
    e.preventDefault();
    setBudgetEditError("");
    setBudgetEditSuccess("");

    try {
      const payload = {
        name: budgetEditForm.name,
        month: Number(budgetEditForm.month),
        year: Number(budgetEditForm.year),
        planned_amount: Number(budgetEditForm.planned_amount),
      };

      const res = await fetch(`${BASE_URL}/budgets/${budgetEditForm.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setBudgetEditError(msg);
        return;
      }

      setBudgetEditSuccess("Budget updated.");
      setShowBudgetEditModal(false);
      fetchBudgets();
    } catch (e2) {
      setBudgetEditError("Network error. Please try again.");
    }
  };

  //brisanje budzeta
  const deleteBudget = async (id) => {
    const ok = window.confirm("Delete this budget?");
    if (!ok) return;

    try {
      const res = await fetch(`${BASE_URL}/budgets/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        alert(msg);
        return;
      }

      fetchBudgets();
    } catch (e) {
      alert("Network error. Please try again.");
    }
  };

  // kolone za tabelu
  const budgetColumns = useMemo(() => {
    return [
      { header: "Name", accessor: "name" },
      {
        header: "Category",
        render: (row) => row?.category?.name || "-",
      },
      { header: "Month", accessor: "month" },
      { header: "Year", accessor: "year" },
      {
        header: "Planned Amount",
        render: (row) => row?.planned_amount ?? "-",
      },
      {
        header: "Actions",
        render: (row) => (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => openEditBudget(row)}>
              Edit
            </button>
            <button type="button" onClick={() => deleteBudget(row.id)}>
              Delete
            </button>
          </div>
        ),
      },
    ];
  }, []);

  // paginacija
  const currentPage = budgetsMeta?.current_page || 1;
  const lastPage = budgetsMeta?.last_page || 1;

  const goToPage = (p) => {
    const next = { ...filterType, page: p };
    setFilterType(next);
    fetchBudgets(next);
  };

  // prikaz cele komponente - modali, kartice i tabela
  return (
    <div className="page">
      {/* ACCOUNTS */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 className="dash-title" style={{ fontSize: 28 }}>Accounts</h2>
          <button type="button" onClick={() => setShowAccountModal(true)}>
            Create account
          </button>
        </div>

        {accountsError && <div className="alert alert-error">{accountsError}</div>}
        {accountsLoading && <p>Loading accounts</p>}

        <div className="accounts-grid">
          {accounts.map((a) => (
            <div key={a.id} className="account-card">
              <div className="account-card-top">
                <div className="account-name">{a.name}</div>
                <div className="account-currency">{a.currency}</div>
              </div>

              <div className="account-row">
                <span>Initial</span>
                <strong>{a.initial_balance}</strong>
              </div>

              <div className="account-row">
                <span>Current</span>
                <strong>{a.current_balance}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BUDGETS */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 className="dash-title" style={{ fontSize: 28 }}>Budgets</h2>
          <button type="button" onClick={() => setShowBudgetCreateModal(true)}>
            Create budget
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, marginBottom: 10 }}>
          <select
            value={filterType.month}
            onChange={(e) => setFilterType((p) => ({ ...p, month: e.target.value, page: 1 }))}
          >
            <option value="">Month (all)</option>
            {monthNames.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Year (all)"
            value={filterType.year}
            onChange={(e) => setFilterType((p) => ({ ...p, year: e.target.value, page: 1 }))}
            style={{ maxWidth: 160 }}
          />

          <select
            value={filterType.categoryName}
            onChange={(e) => setFilterType((p) => ({ ...p, categoryName: e.target.value, page: 1 }))}
          >
            <option value="">Category (all)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => fetchBudgets({ ...filterType, page: 1 })}>
            Apply filters
          </button>

          <button
            type="button"
            onClick={() => {
              const next = { month: "", year: "", categoryName: "", page: 1 };
              setFilterType(next);
              fetchBudgets(next);
            }}
          >
            Reset
          </button>
        </div>

        {categoriesError && <div className="alert alert-error">{categoriesError}</div>}
        {budgetsError && <div className="alert alert-error">{budgetsError}</div>}
        {budgetsLoading && <p>Loading budgets</p>}

        <ReusableTable columns={budgetColumns} data={budgets} />

        {/* Pagination */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
          <button type="button" onClick={() => goToPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            Prev
          </button>

          <span>
            Page {currentPage} of {lastPage}.
          </span>

          <button type="button" onClick={() => goToPage(Math.min(lastPage, currentPage + 1))} disabled={currentPage >= lastPage}>
            Next
          </button>
        </div>
      </div>

      {/* MODAL: CREATE ACCOUNT */}
      {showAccountModal && (
        <div className="sw-modal-backdrop" onClick={() => setShowAccountModal(false)}>
          <div className="sw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create account</h3>

            {accountFormError && <div className="alert alert-error">{accountFormError}</div>}
            {accountFormSuccess && <div className="alert alert-success">{accountFormSuccess}</div>}

            <form onSubmit={createAccount} className="modal-form">
              <input
                type="text"
                placeholder="Account name."
                value={accountForm.name}
                onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Initial balance."
                value={accountForm.initial_balance}
                onChange={(e) => setAccountForm((p) => ({ ...p, initial_balance: e.target.value }))}
              />

              <select
                value={accountForm.currency}
                onChange={(e) => setAccountForm((p) => ({ ...p, currency: e.target.value }))}
              >
                <option value="RSD">RSD.</option>
                <option value="EUR">EUR.</option>
              </select>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAccountModal(false)}>
                  Cancel
                </button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE BUDGET */}
      {showBudgetCreateModal && (
        <div className="sw-modal-backdrop" onClick={() => setShowBudgetCreateModal(false)}>
          <div className="sw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create budget</h3>

            {budgetCreateError && <div className="alert alert-error">{budgetCreateError}</div>}
            {budgetCreateSuccess && <div className="alert alert-success">{budgetCreateSuccess}</div>}

            <form onSubmit={createBudget} className="modal-form">
              <select
                value={budgetCreateForm.category_id}
                onChange={(e) => onBudgetCreateChange("category_id", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}.
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Budget name."
                value={budgetCreateForm.name}
                onChange={(e) => onBudgetCreateChange("name", e.target.value)}
              />

              <select
                value={budgetCreateForm.month}
                onChange={(e) => onBudgetCreateChange("month", e.target.value)}
              >
                <option value="">Select month</option>
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}.
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="2000"
                placeholder="Year."
                value={budgetCreateForm.year}
                onChange={(e) => onBudgetCreateChange("year", e.target.value)}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Planned amount."
                value={budgetCreateForm.planned_amount}
                onChange={(e) => onBudgetCreateChange("planned_amount", e.target.value)}
              />

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowBudgetCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BUDGET */}
      {showBudgetEditModal && (
        <div className="sw-modal-backdrop" onClick={() => setShowBudgetEditModal(false)}>
          <div className="sw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit budget</h3>

            {budgetEditError && <div className="alert alert-error">{budgetEditError}</div>}
            {budgetEditSuccess && <div className="alert alert-success">{budgetEditSuccess}</div>}

            <form onSubmit={updateBudget} className="modal-form">
              <input
                type="text"
                placeholder="Budget name."
                value={budgetEditForm.name}
                onChange={(e) => setBudgetEditForm((p) => ({ ...p, name: e.target.value }))}
              />

              <select
                value={budgetEditForm.month}
                onChange={(e) => setBudgetEditForm((p) => ({ ...p, month: e.target.value }))}
              >
                <option value="">Select month</option>
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}.
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="2000"
                placeholder="Year."
                value={budgetEditForm.year}
                onChange={(e) => setBudgetEditForm((p) => ({ ...p, year: e.target.value }))}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Planned amount."
                value={budgetEditForm.planned_amount}
                onChange={(e) => setBudgetEditForm((p) => ({ ...p, planned_amount: e.target.value }))}
              />

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowBudgetEditModal(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsBudgets;
