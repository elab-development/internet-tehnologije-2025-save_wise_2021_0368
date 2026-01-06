import React from "react";

const ReusableTable = ({ columns = [], data = [] }) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="sw-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header || c.accessor}>{c.header}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 14 }}>
                No data
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.header || c.accessor}>
                    {c.render ? c.render(row) : row?.[c.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReusableTable;
