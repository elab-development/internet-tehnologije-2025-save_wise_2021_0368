import React from "react";

const AuthForm = ({
  title,
  errorMsg,
  successMsg,
  onSubmit,
  fields,
  submitText,
  footer,
}) => {
  return (
    <div className="page">
      <div className="auth-card">
        <h2 className="auth-title">{title}</h2>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={onSubmit} className="auth-form">
          {fields.map((f) => (
            <input
              key={f.name}
              type={f.type}
              placeholder={f.placeholder}
              value={f.value}
              onChange={f.onChange}
            />
          ))}

          <button type="submit">{submitText}</button>
        </form>

        {footer}
      </div>
    </div>
  );
};

export default AuthForm;
