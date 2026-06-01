import { GrowthApp } from "@/components/growth-app";
import { getDemoSnapshot } from "@/lib/demo-data";

export default function HomePage() {
  return <GrowthApp initialSnapshot={getDemoSnapshot()} />;
}
