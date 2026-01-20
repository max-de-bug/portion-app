import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Sidebar - Fixed width, doesn't overlap */}
        <div className="w-[220px] shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header />

          {/* Dashboard Content */}
          <main className="flex-1 overflow-x-hidden">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
