import { SidebarMenu } from "@/components/layout/sidebar-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex" }}>
      <SidebarMenu />
      <div className="main-content">
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
