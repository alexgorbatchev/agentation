"use client";

import { HeroDemoScene } from "./HeroDemoScene";
import { useHeroDemoTimeline } from "./useHeroDemoTimeline";

export function HeroDemo(): JSX.Element {
  const heroDemoTimeline = useHeroDemoTimeline();

  return <HeroDemoScene state={heroDemoTimeline.state} refs={heroDemoTimeline.refs} />;
}
