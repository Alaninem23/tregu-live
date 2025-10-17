"use client";
import AccountCreateForm from "../../components/AccountCreateForm";

export default function CreatePage() {
  return (
    <main
      className="space-y-6 p-6"
      style={{ background: "linear-gradient(180deg,#fff7ed,transparent)" }}
    >
      <AccountCreateForm />
    </main>
  );
}
