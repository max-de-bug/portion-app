import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-[220px]">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        {children}
      </div>
    </div>
  );
}
