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
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="ml-[220px]">
          {/* Header */}
          <Header />

          {/* Dashboard Content */}
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}
