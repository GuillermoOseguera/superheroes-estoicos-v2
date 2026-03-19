"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Swords, BookOpen, Target, Trophy, BarChart2, LogOut, Users } from "lucide-react";
import { useProfile } from "@/lib/profile-store";

const NAV_ITEMS = [
  { href: "/home", label: "Cuartel General", icon: Home },
  { href: "/juegos", label: "Sala de Entrenamiento", icon: Swords },
  { href: "/historias", label: "Biblioteca", icon: BookOpen },
  { href: "/misiones", label: "Misiones", icon: Target },
  { href: "/logros", label: "Sala de Trofeos", icon: Trophy },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart2 },
];

export function SidebarMenu() {
  const pathname = usePathname();
  const { logout, activeAccount } = useProfile();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ width: 80, height: 80, position: 'relative', marginBottom: 4 }}>
          <Image 
            src="/images/gop_logo.png" 
            alt="Goplemmings Logo" 
            fill 
            style={{ objectFit: 'contain' }} 
            priority
          />
        </div>
        <span className="sidebar-logo-text">ACADEMIA ESTOICA<br/>GOPLEMMINGS</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 8px",
          borderTop: "1px solid var(--sidebar-border)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}
      >
        <Link href="/" className="sidebar-item" style={{ padding: "8px 12px" }}>
          <Users size={18} />
          <span style={{ fontSize: 13 }}>Cambiar Héroe</span>
        </Link>
        <button 
          onClick={logout} 
          className="sidebar-item" 
          style={{ 
            padding: "8px 12px", background: "none", border: "none", width: "100%", 
            textAlign: "left", cursor: "pointer", color: "#ef4444" 
          }}
        >
          <LogOut size={18} />
          <span style={{ fontSize: 13 }}>Salir ({activeAccount?.username})</span>
        </button>
      </div>
    </aside>
  );
}
