import React from "react";
import DashboardHero from "../Components/DashboardHero";

const AdminHome = () => {
  return (
    <DashboardHero
      title="Admin Dashboard"
      subtitle="Manage categories and keep SaveWise organized for every user."
      actions={[
        {
          title: "Categories Management",
          description: "Create, edit and remove categories for the whole system.",
          to: "/admin/categories",
        }
        
      ]}
      images={[
        {
          src: "/image1.jpg",
          badge: "Savings.",
          caption: "Build better habits.",
          alt: "SaveWise image 1",
        },
        {
          src: "/image2.jpg",
          badge: "Control.",
          caption: "Stay consistent.",
          alt: "SaveWise image 2",
        },
      ]}
      tipText="Tip: Keep categories consistent so users can track budgets and transactions easily."
    />
  );
};

export default AdminHome;
