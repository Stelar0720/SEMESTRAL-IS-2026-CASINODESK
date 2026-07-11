import type { RiskLevel } from "../app/types";

const badgeClasses: Record<RiskLevel, string> = {
  VERDE: "badge badge-green",
  AMARILLO: "badge badge-yellow",
  ROJO: "badge badge-red"
};

const dotClasses: Record<RiskLevel, string> = {
  VERDE: "risk-dot risk-green",
  AMARILLO: "risk-dot risk-yellow",
  ROJO: "risk-dot risk-red"
};

export function RiskBadge({ risk }: { readonly risk: RiskLevel }) {
  return (
    <span className={badgeClasses[risk]}>
      <span className={dotClasses[risk]} />
      {risk}
    </span>
  );
}
