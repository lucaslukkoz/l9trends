"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ComposeForm from "@/components/ComposeForm";
import { AccountProvider } from "@/context/AccountContext";

export default function ComposePage() {
  return (
    <ProtectedRoute>
      <AccountProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <Navbar />
          <div className="flex flex-1 min-h-0">
            <Sidebar />
            <main className="flex-1 min-h-0 overflow-y-auto p-6">
              <ComposeForm />
            </main>
          </div>
        </div>
      </AccountProvider>
    </ProtectedRoute>
  );
}
