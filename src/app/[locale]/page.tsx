import { Hero } from "@/components/sections/hero";
import { LearningSection } from "@/components/sections/learning-section";
import { PluginsSection } from "@/components/sections/plugins-section";
import { RankingSection } from "@/components/sections/ranking-section";

export default function Home() {
  return (
    <>
      <Hero />
      <LearningSection />
      <PluginsSection />
      <RankingSection />
    </>
  );
}
