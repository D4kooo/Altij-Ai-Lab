import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollState {
  // Current section index (0-5)
  currentSection: number;
  // Continuous progress: section index + transition progress (e.g., 2.5 = between section 2 and 3)
  continuousProgress: number;
  // Total progress 0-1 through entire page
  totalProgress: number;
}

interface UseScrollProgressOptions {
  sectionCount: number;
  sectionIds: string[];
}

export function useScrollProgress({
  sectionCount,
  sectionIds,
}: UseScrollProgressOptions): ScrollState {
  const [state, setState] = useState<ScrollState>({
    currentSection: 0,
    continuousProgress: 0,
    totalProgress: 0,
  });

  // Track section positions and visibility
  const sectionProgressRef = useRef<number[]>(new Array(sectionCount).fill(0));
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    // Create a ScrollTrigger for each section
    sectionIds.forEach((id, index) => {
      const element = document.getElementById(id);
      if (!element) return;

      const trigger = ScrollTrigger.create({
        trigger: element,
        start: 'top center',    // Section starts when its top hits viewport center
        end: 'bottom center',   // Section ends when its bottom leaves viewport center
        scrub: true,
        onUpdate: (self) => {
          // Progress 0-1 for this section being in center zone
          sectionProgressRef.current[index] = self.progress;

          // Calculate which section is most "centered"
          // When a section's progress is between 0.4-0.6, it's centered
          let bestSection = 0;
          let bestCenterScore = -1;

          sectionProgressRef.current.forEach((progress, idx) => {
            // Score is highest when progress is around 0.5 (center of section in center of viewport)
            const centerScore = 1 - Math.abs(progress - 0.5) * 2;
            if (progress > 0 && progress < 1 && centerScore > bestCenterScore) {
              bestCenterScore = centerScore;
              bestSection = idx;
            }
          });

          // Calculate continuous progress based on current section and its progress
          const currentProgress = sectionProgressRef.current[bestSection] || 0;

          // Map section progress to transition timing:
          // VERY EXTENDED hold zone for slow, cinematic transitions
          // 0.0-0.1: transitioning IN (10% of scroll)
          // 0.1-0.9: HOLD - formation stays complete (80% of scroll)
          // 0.9-1.0: transitioning OUT (10% of scroll)
          let transitionValue = bestSection;
          if (currentProgress <= 0.1) {
            // Transitioning in - very brief
            transitionValue = bestSection + currentProgress * 0.5; // 0 to 0.05
          } else if (currentProgress <= 0.9) {
            // HOLD - formation is complete and stable for 80% of the scroll
            transitionValue = bestSection + 0.05;
          } else {
            // Transitioning out - start morphing to next section
            const outProgress = (currentProgress - 0.9) / 0.1; // 0 to 1
            transitionValue = bestSection + 0.05 + outProgress * 0.95; // 0.05 to 1.0
          }

          targetProgressRef.current = transitionValue;
        },
      });

      triggers.push(trigger);
    });

    // Smooth animation loop - very slow interpolation for cinematic feel
    const updateProgress = () => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;

      // ULTRA slow interpolation (0.015 = ~66 frames to reach target for cinematic feel)
      const smoothed = current + (target - current) * 0.015;
      currentProgressRef.current = smoothed;

      const currentSection = Math.floor(smoothed);

      setState({
        currentSection: Math.min(currentSection, sectionCount - 1),
        continuousProgress: smoothed,
        totalProgress: smoothed / sectionCount,
      });
    };

    gsap.ticker.add(updateProgress);

    return () => {
      triggers.forEach((t) => t.kill());
      gsap.ticker.remove(updateProgress);
    };
  }, [sectionCount, sectionIds]);

  return state;
}

export default useScrollProgress;
