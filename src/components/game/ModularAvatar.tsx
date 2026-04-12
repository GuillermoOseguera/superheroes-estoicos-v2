import Image from "next/image";
import { getCurrentMilestone } from "@/lib/level-milestones";

interface ModularAvatarProps {
  heroId: string;
  level: number;
}

export default function ModularAvatar({ heroId, level }: ModularAvatarProps) {
  const milestone = getCurrentMilestone(heroId, level);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 18%, ${milestone.accentFrom}22 0%, transparent 48%)`,
          zIndex: 1,
        }}
      />

      <Image
        src={milestone.image}
        alt={milestone.title}
        fill
        sizes="(max-width: 768px) 100vw, 260px"
        style={{ objectFit: "cover", zIndex: 2 }}
        priority
      />

      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          zIndex: 3,
          borderRadius: 14,
          padding: "10px 12px",
          background: "rgba(15,23,42,0.68)",
          color: "white",
          backdropFilter: "blur(8px)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Forma Actual
        </div>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
          {milestone.badge}
        </div>
      </div>
    </div>
  );
}
