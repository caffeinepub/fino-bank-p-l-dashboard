import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeftRight,
  Bell,
  Building2,
  CreditCard,
  FileDown,
  HelpCircle,
  LayoutDashboard,
  Menu,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FDHistory } from "./components/FDHistory";
import { PLDashboard } from "./components/PLDashboard";
import { ProfitLossTab } from "./components/ProfitLossTab";
import { Reports } from "./components/Reports";
import { TransactionHistory } from "./components/TransactionHistory";
import { useLocalStore } from "./hooks/useLocalStore";

type Tab = "dashboard" | "fd" | "reports" | "transactions" | "profitloss";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const store = useLocalStore();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Cash In/Out",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    { id: "fd", label: "FD History", icon: <CreditCard className="w-4 h-4" /> },
    {
      id: "transactions",
      label: "Transaction History",
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      id: "profitloss",
      label: "Profit & Loss",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    { id: "reports", label: "Reports", icon: <FileDown className="w-4 h-4" /> },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntries = store.plEntries.filter((e) => e.date === todayStr);
  const totalCashIn = todayEntries
    .filter((e) => e.type === "cashin" || e.type === "profit")
    .reduce((s, e) => s + e.amount, 0);
  const totalCashOut = todayEntries
    .filter((e) => e.type === "cashout" || e.type === "loss")
    .reduce((s, e) => s + e.amount, 0);
  const totalBalance = totalCashIn - totalCashOut;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster richColors position="top-right" />

      {/* Utility strip */}
      <div className="bg-navy-dark py-1.5 px-4 flex justify-between items-center">
        <span className="text-xs text-white/60">{today}</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-white/70 hover:text-white transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="text-white/70 hover:text-white transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 text-white/70">
            <User className="w-3.5 h-3.5" />
            <span className="text-xs">Branch Manager</span>
          </div>
        </div>
      </div>

      {/* Primary Header */}
      <header className="bg-navy shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">
                Fino Small Finance Bank
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center bg-white/20 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  Doolahat Branch
                </span>
                <span className="text-white/50 text-[10px]">
                  IFSC: FINO0001599
                </span>
              </div>
            </div>
          </div>

          {/* Desktop KPI summary */}
          <div className="hidden md:flex items-center gap-6 text-center">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">
                Today&apos;s Net
              </p>
              <p
                className={`font-bold text-sm ${
                  totalBalance >= 0 ? "text-green-300" : "text-red-300"
                }`}
              >
                &#8377;{Math.abs(totalBalance).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">
                FD Records
              </p>
              <p className="font-bold text-sm text-white">
                {store.fdRecords.length}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">
                Cash Entries
              </p>
              <p className="font-bold text-sm text-white">
                {store.plEntries.length}
              </p>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden text-white p-1"
            onClick={() => setMobileMenuOpen((o) => !o)}
            data-ocid="nav.toggle"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Nav tabs - desktop */}
        <nav className="max-w-7xl mx-auto px-4 hidden md:flex gap-1 pb-0">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id}.tab`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-white text-white"
                  : "border-transparent text-white/60 hover:text-white/90"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-navy overflow-hidden md:hidden"
          >
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                data-ocid={`nav.${tab.id}.tab`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-5 py-3 text-sm font-medium border-l-4 transition-colors ${
                  activeTab === tab.id
                    ? "border-white text-white bg-white/10"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dashboard" && (
              <PLDashboard
                paymentHeads={store.paymentHeads}
                plEntries={store.plEntries}
                onAddEntry={store.addPLEntry}
                onDeleteEntry={store.deletePLEntry}
                onAddHead={store.addPaymentHead}
                onEditHead={store.editPaymentHead}
                onDeleteHead={store.deletePaymentHead}
              />
            )}
            {activeTab === "fd" && (
              <FDHistory
                fdRecords={store.fdRecords}
                onAdd={store.addFDRecord}
                onDelete={store.deleteFDRecord}
              />
            )}
            {activeTab === "transactions" && (
              <TransactionHistory
                transactions={store.transactions}
                onAdd={store.addTransaction}
                onDelete={store.deleteTransaction}
                onUpdateStatus={store.updateTransactionStatus}
              />
            )}
            {activeTab === "profitloss" && (
              <ProfitLossTab
                plRecords={store.plRecords}
                plEntries={store.plEntries}
                onAdd={store.addPLRecord}
                onDelete={store.deletePLRecord}
              />
            )}
            {activeTab === "reports" && (
              <Reports
                plEntries={store.plEntries}
                fdRecords={store.fdRecords}
                transactions={store.transactions}
                plRecords={store.plRecords}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-navy py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/50 text-xs">
            &copy; {new Date().getFullYear()} Fino Small Finance Bank – Doolahat
            Branch. All rights reserved.
          </p>
          <p className="text-white/40 text-xs">
            Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
