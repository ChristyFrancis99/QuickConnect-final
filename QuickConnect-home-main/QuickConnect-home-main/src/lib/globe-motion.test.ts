import { describe, expect, it } from "vitest";
import { getGlobeCameraFov, getPanelMotion } from "./globe-motion";

describe("scroll-controlled gallery panel motion", () => {
  it("keeps every panel assembled at the start of the scroll", () => {
    expect(getPanelMotion(4, 0)).toEqual({
      x: 0,
      y: 0,
      z: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      opacity: 1,
    });
  });

  it("separates and fades panels fully by the end of the scroll", () => {
    const motion = getPanelMotion(4, 1);

    expect(Math.hypot(motion.x, motion.y, motion.z)).toBeGreaterThan(2.7);
    expect(motion.opacity).toBe(0);
  });

  it("clamps scroll progress to its reversible assembled and dispersed endpoints", () => {
    expect(getPanelMotion(12, -0.5)).toEqual(getPanelMotion(12, 0));
    expect(getPanelMotion(12, 1.5)).toEqual(getPanelMotion(12, 1));
  });
});

describe("globe camera framing", () => {
  it("keeps the assembled globe at its original field of view", () => {
    expect(getGlobeCameraFov(0)).toBe(40);
  });

  it("widens the view as panels disperse and clamps out-of-range progress", () => {
    expect(getGlobeCameraFov(0.5)).toBeGreaterThan(80);
    expect(getGlobeCameraFov(1)).toBe(100);
    expect(getGlobeCameraFov(-1)).toBe(40);
    expect(getGlobeCameraFov(2)).toBe(100);
  });
});
