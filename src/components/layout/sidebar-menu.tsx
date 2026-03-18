"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Swords, BookOpen, Target, Trophy, BarChart2 } from "lucide-react";

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
        }}
      >
        <Link href="/" className="sidebar-item">
          <span style={{ fontSize: 18 }}>🦸</span>
          <span>Cambiar Héroe</span>
        </Link>
      </div>
    </aside>
  );
}
