"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-store";
import { supabase, purchaseShopItem, equipShopItem, type ShopItem } from "@/lib/supabase";

export default function TallerPage() {
  const { activeProfile, refreshProfile, sessionLoading } = useProfile();
  const router = useRouter();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"frame" | "title">("frame");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProfile) {
      if (!sessionLoading) router.replace("/select-hero");
      return;
    }

    Promise.all([
      supabase.from("shop_items").select("*").order("sort_order"),
      supabase.from("user_purchases").select("item_id").eq("user_id", activeProfile.id),
    ]).then(([itemsRes, purchasesRes]) => {
      if (itemsRes.data) setItems(itemsRes.data as ShopItem[]);
      if (purchasesRes.data) {
        setOwnedIds(new Set((purchasesRes.data as { item_id: string }[]).map((p) => p.item_id)));
      }
    });
  }, [activeProfile, router]);

  if (!activeProfile) return null;

  const currentLevel = activeProfile.level;
  const coins = activeProfile.coins ?? 0;

  const handleBuy = async (item: ShopItem) => {
    setBusyId(item.id);
    try {
      const result = await purchaseShopItem(activeProfile.id, item);
      if (result.ok) {
        setOwnedIds((prev) => new Set(prev).add(item.id));
        toast.success(`¡${item.name} desbloqueado!`, { icon: item.icon });
        await refreshProfile();
      } else {
        toast.error(result.reason || "No se pudo comprar.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    setBusyId(item.id);
    try {
      await equipShopItem(activeProfile.id, item);
      toast.success(`${item.name} equipado`, { icon: "✅" });
      await refreshProfile();
    } finally {
      setBusyId(null);
    }
  };

  const visibleItems = items.filter((i) => i.category === tab);

  return (
    <div>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Taller del Héroe</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            🛠️ Taller del Héroe
          </h2>
          <p style={{ color: "#64748b" }}>Cambia tus monedas por marcos y títulos para tu perfil.</p>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #fbbf24, #d97706)", color: "#1e293b", borderRadius: 12,
          padding: "10px 20px", fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8,
        }}>
          🪙 {coins} monedas
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["frame", "title"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer",
              border: tab === t ? "none" : "1px solid #e2e8f0",
              background: tab === t ? "#1e293b" : "white",
              color: tab === t ? "white" : "#64748b",
            }}
          >
            {t === "frame" ? "🖼️ Marcos" : "🏷️ Títulos"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
        {visibleItems.map((item, i) => {
          const owned = ownedIds.has(item.id);
          const equipped = tab === "frame" ? activeProfile.equipped_frame === item.id : activeProfile.equipped_title === item.id;
          const locked = currentLevel < item.required_level;
          const canAfford = coins >= item.cost_coins;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="parchment-card"
              style={{ textAlign: "center", padding: 20, opacity: locked ? 0.6 : 1 }}
            >
              <div
                style={{
                  width: 84, height: 84, borderRadius: "50%", margin: "0 auto 14px",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38,
                  background: `linear-gradient(145deg, ${item.accent_from}, ${item.accent_to})`,
                  border: equipped ? "3px solid #1e293b" : "3px solid rgba(255,255,255,0.5)",
                  boxShadow: `0 10px 24px ${item.accent_from}55`,
                }}
              >
                {item.icon}
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, minHeight: 32 }}>{item.description}</div>

              {locked ? (
                <div style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", background: "#fee2e2", borderRadius: 8, padding: "6px 10px" }}>
                  🔒 Nivel {item.required_level}
                </div>
              ) : owned ? (
                <button
                  onClick={() => handleEquip(item)}
                  disabled={equipped || busyId === item.id}
                  style={{
                    width: "100%", padding: "8px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none",
                    cursor: equipped ? "default" : "pointer",
                    background: equipped ? "#dcfce7" : "#1e293b",
                    color: equipped ? "#166534" : "white",
                  }}
                >
                  {equipped ? "✅ Equipado" : "Equipar"}
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford || busyId === item.id}
                  style={{
                    width: "100%", padding: "8px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none",
                    cursor: canAfford ? "pointer" : "not-allowed",
                    background: canAfford ? "linear-gradient(135deg, #fbbf24, #d97706)" : "#e2e8f0",
                    color: canAfford ? "#1e293b" : "#94a3b8",
                  }}
                >
                  🪙 {item.cost_coins}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
