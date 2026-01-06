import React from "react";
import { Link } from "react-router-dom";

//reusable komponenta jer ce nam i admin i home biti vrlo slicnog izgleda pocetne stranice
const DashboardHero = ({
  title,
  subtitle,
  actions = [],
  images = [],
  tipText,
}) => {
  return (
    <div className="page">
      <div className="dash-hero">
        <div className="dash-left">
          <h2 className="dash-title">{title}</h2>
          <p className="dash-subtitle">{subtitle}</p>

          <div className="dash-actions">
            {actions.map((a) => {
              if (a.disabled) {
                return (
                  <div key={a.title} className="dash-card dash-card-disabled">
                    <div className="dash-card-title">{a.title}</div>
                    <div className="dash-card-desc">{a.description}</div>
                  </div>
                );
              }

              return (
                <Link key={a.title} to={a.to} className="dash-card">
                  <div className="dash-card-title">{a.title}</div>
                  <div className="dash-card-desc">{a.description}</div>
                </Link>
              );
            })}
          </div>
           {tipText && <div className="dash-tip">{tipText}</div>}
        </div>

        <div className="dash-right">
          {images?.length > 0 && (
            <div className="dash-image-grid">
              {images.map((img) => (
                <div key={img.src} className="dash-image-card">
                  <img className="dash-image" src={img.src} alt={img.alt || "image"} />
                  <div className="dash-image-overlay">
                    {img.badge && <div className="dash-image-badge">{img.badge}</div>}
                    {img.caption && <div className="dash-image-caption">{img.caption}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

         
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
