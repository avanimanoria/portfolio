"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SKILLS, Skill } from "@/data/constants";
import { useSounds } from "./realtime/hooks/use-sounds";
import styles from "./piano-background.module.scss";

gsap.registerPlugin(ScrollTrigger);

const WHITE_KEY_COUNT = 14;
const BLACK_KEY_SLOTS = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13];

type PianoState = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
};

const PIANO_STATES: Record<"hero" | "skills" | "projects" | "contact", PianoState> = {
  hero: { x: 0, y: 0, scale: 1, rotate: 0 },
  skills: { x: 0, y: 52, scale: 1.02, rotate: 0 },
  projects: { x: 0, y: -26, scale: 1.05, rotate: 0 },
  contact: { x: 120, y: -80, scale: 0.95, rotate: 0 },
};

const PianoBackground = () => {
  const pianoRef = useRef<HTMLDivElement>(null);
  const { playPressSound, playReleaseSound } = useSounds();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const { whiteSkills, blackSkills } = useMemo(() => {
    const skills = Object.values(SKILLS);
    return {
      whiteSkills: skills.slice(0, WHITE_KEY_COUNT),
      blackSkills: skills.slice(WHITE_KEY_COUNT),
    };
  }, []);

  useEffect(() => {
    if (!pianoRef.current) return;

    const getCenteredX = () => {
      if (!pianoRef.current) return 0;
      const rect = pianoRef.current.getBoundingClientRect();
      const styles = window.getComputedStyle(pianoRef.current);
      const marginRight = Number.parseFloat(styles.marginRight || "0");
      const viewportWidth = window.innerWidth;
      const rightAlignedLeft = viewportWidth - rect.width - marginRight;
      const centeredLeft = (viewportWidth - rect.width) / 2;

      return centeredLeft - rightAlignedLeft;
    };

    const applyState = (
      target: keyof typeof PIANO_STATES,
      durationOverride?: number,
      delayOverride?: number
    ) => {
      const state = PIANO_STATES[target];
      const nextX = target === "skills" ? getCenteredX() : state.x;
      const duration = durationOverride ?? (target === "skills" ? 4.2 : 0.9);
      gsap.to(pianoRef.current, {
        x: nextX,
        y: state.y,
        scale: state.scale,
        rotate: state.rotate,
        duration,
        delay: delayOverride,
        ease: "power3.out",
      });
    };

    applyState("hero");

    const triggers: ScrollTrigger[] = [];

    const createSectionTrigger = (
      triggerId: string,
      target: keyof typeof PIANO_STATES,
      prev: keyof typeof PIANO_STATES,
      start: string = "top 50%",
      end: string = "bottom bottom",
      options?: { leaveBackDuration?: number; leaveBackDelay?: number }
    ) => {
      const trigger = ScrollTrigger.create({
        trigger: triggerId,
        start,
        end,
        scrub: true,
        // Forward transition: hero -> skills when entering the skills section.
        onEnter: () => applyState(target),
        // Reverse transition: skills -> hero when scrolling back above the skills section.
        onLeaveBack: () =>
          applyState(prev, options?.leaveBackDuration, options?.leaveBackDelay),
      });
      triggers.push(trigger);
    };

    // Forward + reverse timing for the hero <-> skills transition.
    createSectionTrigger("#skills", "skills", "hero", "top 100%", "bottom bottom", {
      leaveBackDuration: 4.2,
      leaveBackDelay: 0,
    });
    createSectionTrigger("#projects", "projects", "skills", "top 70%");
    createSectionTrigger("#contact", "contact", "projects", "top 30%");

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleSelect = (skill: Skill) => {
    if (selectedSkill?.name === skill.name) return;
    playPressSound();
    setSelectedSkill(skill);
  };

  const handleClear = () => {
    if (!selectedSkill) return;
    playReleaseSound();
    setSelectedSkill(null);
  };

  return (
    <div className={styles.wrapper}>
      <div ref={pianoRef} className={styles.piano}>
        <div className={styles.skillInfo}>
          {selectedSkill && (
            <div className={styles.skillCard}>
              <strong>{selectedSkill.label}</strong> - {selectedSkill.shortDescription}
            </div>
          )}
        </div>
        <div className={styles.whiteKeys}>
          {whiteSkills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              className={styles.whiteKey}
              aria-label={skill.label}
              data-active={selectedSkill?.name === skill.name}
              onMouseEnter={() => handleSelect(skill)}
              onFocus={() => handleSelect(skill)}
              onMouseLeave={handleClear}
              onBlur={handleClear}
            >
              <img src={skill.icon} alt={skill.label} loading="lazy" />
            </button>
          ))}
        </div>
        <div className={styles.blackKeys}>
          {blackSkills.map((skill, index) => {
            const slot = BLACK_KEY_SLOTS[index % BLACK_KEY_SLOTS.length];
            const left = `${(slot / WHITE_KEY_COUNT) * 100}%`;
            return (
              <button
                key={skill.id}
                type="button"
                className={styles.blackKey}
                style={{ left }}
                aria-label={skill.label}
                data-active={selectedSkill?.name === skill.name}
                onMouseEnter={() => handleSelect(skill)}
                onFocus={() => handleSelect(skill)}
                onMouseLeave={handleClear}
                onBlur={handleClear}
              >
                <img src={skill.icon} alt={skill.label} loading="lazy" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PianoBackground;
