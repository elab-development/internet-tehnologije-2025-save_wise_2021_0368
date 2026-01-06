import React, { useEffect, useMemo, useState } from "react";
import ReusableTable from "../Components/ReusableTable";

const BASE_URL = "http://127.0.0.1:8000/api";

export default function AdminCategories({ token }) {
    //pomocan header za autentifikaciju
  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  //definisemo sve promenljive koje cemo koristiti 

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [createName, setCreateName] = useState("");
  const [editForm, setEditForm] = useState({ id: null, name: "" });

  const readErrorMessage = async (res) => {
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      if (res.status === 401) return "Unauthorized. Please login again.";
      if (res.status === 403) return "Forbidden. Admin only.";
      if (res.status === 409) return "Category cannot be deleted because it is used.";
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

    if (res.status === 409) return "Category cannot be deleted because it is used.";
    return "Something went wrong. Please try again later.";
  };

  const fetchCategories = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: "GET",
        headers: authHeaders,
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setErrorMsg(msg);
        setCategories([]);
        return;
      }

      const data = await res.json();

      const list = Array.isArray(data) ? data : (data?.data || []);
      setCategories(list);
    } catch (e) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchCategories();
  }, [token]);

  // CREATE metoda 
  const createCategory = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ name: createName }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setErrorMsg(msg);
        return;
      }

      setSuccessMsg("Category created.");
      setShowCreateModal(false);
      setCreateName("");
      fetchCategories();
    } catch (e2) {
      setErrorMsg("Network error. Please try again.");
    }
  };

  // EDIT metoda
  const openEdit = (c) => {
    setErrorMsg("");
    setSuccessMsg("");
    setEditForm({ id: c.id, name: c.name || "" });
    setShowEditModal(true);
  };

  const updateCategory = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${BASE_URL}/categories/${editForm.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ name: editForm.name }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setErrorMsg(msg);
        return;
      }

      setSuccessMsg("Category updated.");
      setShowEditModal(false);
      fetchCategories();
    } catch (e2) {
      setErrorMsg("Network error. Please try again.");
    }
  };

  // DELETE metoda
  const deleteCategory = async (id) => {
    const ok = window.confirm("Delete this category?");
    if (!ok) return;

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setErrorMsg(msg);
        return;
      }

      setSuccessMsg("Category deleted.");
      fetchCategories();
    } catch (e) {
      setErrorMsg("Network error. Please try again.");
    }
  };

  //kolone za reusable tabely
  const columns = useMemo(() => {
    return [
      { header: "ID", accessor: "id" },
      { header: "Name", accessor: "name" },
      {
        header: "Actions",
        render: (row) => (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => openEdit(row)}>
              Edit
            </button>
            <button type="button" onClick={() => deleteCategory(row.id)}>
              Delete
            </button>
          </div>
        ),
      },
    ];
  }, []);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 className="dash-title" style={{ fontSize: 28 }}>
          Categories Management
        </h2>
        <p>
            As an admin, manage different expense and income categories.
        </p>

        <button type="button" onClick={() => setShowCreateModal(true)}>
          Create category
        </button>
      </div>

      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {loading && <p>Loading categories</p>}

      <ReusableTable columns={columns} data={categories} />

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="sw-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="sw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create category</h3>

            <form onSubmit={createCategory} className="modal-form">
              <input
                type="text"
                placeholder="Category name."
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="sw-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="sw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit category</h3>

            <form onSubmit={updateCategory} className="modal-form">
              <input
                type="text"
                placeholder="Category name."
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
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
}
