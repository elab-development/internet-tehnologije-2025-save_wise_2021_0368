import React from "react";
import DashboardHero from "../Components/DashboardHero";

const UserHome = () => {
  return (
    <DashboardHero
      title="Welcome to SaveWise"
      subtitle="Track your spending, manage budgets, and stay in control of your money."
      actions={[
        {
          title: "Accounts & Budgets",
          description: "Create accounts and plan budgets per category.",
          to: "/accounts-budgets",
        },
        {
          title: "Transactions.",
          description: "Add income/expenses and keep your balance updated.",
          to: "/transactions",
        },
        {
          title: "Categories.",
          description: "Browse available categories for better tracking.",
          to: "/accounts-budgets"
        },
      ]}
      images={[
        {
          src: "/image2.jpg",
          badge: "Plan.",
          caption: "Budgets that work.",
          alt: "SaveWise image 2",
        },
        {
          src: "/image1.jpg",
          badge: "Grow.",
          caption: "Save smarter.",
          alt: "SaveWise image 1",
        },
      ]}
      tipText="Tip: Add expenses daily. Small habits make the biggest difference."
    />
  );
};

export default UserHome;
