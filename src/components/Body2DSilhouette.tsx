import React, { useMemo } from "react";
import { UserMeasurements, Gender } from "../types";

export type BodyPartKey =
  | "shoulders"
  | "chest"
  | "arms"
  | "waist"
  | "hips"
  | "thighs"
  | "calves"
  | "neck";

interface Body2DSilhouetteProps {
  gender: Gender;
  measurements: UserMeasurements;
  activePart: BodyPartKey | null;
  onSelectPart: (part: BodyPartKey) => void;
}

// Helper to clamp values
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const Body2DSilhouette: React.FC<Body2DSilhouetteProps> = ({
  gender,
  measurements,
  activePart,
  onSelectPart,
}) => {
  const isFemale = gender === "female";
  const cx = 150;

  // Proportional dynamic scales derived from user measurements
  const scales = useMemo(() => {
    if (isFemale) {
      // Female Baseline Reference
      const baseShoulders = 96;
      const baseChest = 88;
      const baseWaist = 68;
      const baseHips = 98;
      const baseArm = 27;
      const baseThigh = 56;
      const baseCalf = 34;
      const baseNeck = 32;

      const currentArm = measurements.rightArm || measurements.leftArm || baseArm;
      const currentThigh = measurements.rightThigh || measurements.leftThigh || baseThigh;

      const sNeck = clamp((measurements.neck || baseNeck) / baseNeck, 0.85, 1.25);
      const sShoulders = clamp((measurements.shoulders || baseShoulders) / baseShoulders, 0.82, 1.25);
      const sChest = clamp((measurements.chest || baseChest) / baseChest, 0.82, 1.30);
      const sWaist = clamp((measurements.waist || baseWaist) / baseWaist, 0.78, 1.35);
      const sHips = clamp((measurements.hips || baseHips) / baseHips, 0.80, 1.38);
      const sArm = clamp(currentArm / baseArm, 0.80, 1.35);
      const sThigh = clamp(currentThigh / baseThigh, 0.80, 1.35);
      const sCalf = clamp((measurements.calves || baseCalf) / baseCalf, 0.80, 1.35);

      // Feminine coordinates (Hourglass: soft shoulders, prominent bust curve, pinched waist, wide curved hips)
      return {
        neckW: 10 * sNeck,
        shW: 46 * sShoulders,
        chestW: 38 * sChest,
        waistW: 21 * sWaist,
        hipW: 46 * sHips,
        armThick: 10 * sArm,
        thighThick: 17 * sThigh,
        calfThick: 12.5 * sCalf,
      };
    } else {
      // Male Baseline Reference
      const baseShoulders = 118;
      const baseChest = 104;
      const baseWaist = 84;
      const baseHips = 96;
      const baseArm = 37;
      const baseThigh = 58;
      const baseCalf = 37;
      const baseNeck = 39;

      const currentArm = measurements.rightArm || measurements.leftArm || baseArm;
      const currentThigh = measurements.rightThigh || measurements.leftThigh || baseThigh;

      const sNeck = clamp((measurements.neck || baseNeck) / baseNeck, 0.85, 1.25);
      const sShoulders = clamp((measurements.shoulders || baseShoulders) / baseShoulders, 0.82, 1.30);
      const sChest = clamp((measurements.chest || baseChest) / baseChest, 0.82, 1.30);
      const sWaist = clamp((measurements.waist || baseWaist) / baseWaist, 0.78, 1.35);
      const sHips = clamp((measurements.hips || baseHips) / baseHips, 0.80, 1.30);
      const sArm = clamp(currentArm / baseArm, 0.80, 1.40);
      const sThigh = clamp(currentThigh / baseThigh, 0.80, 1.35);
      const sCalf = clamp((measurements.calves || baseCalf) / baseCalf, 0.80, 1.35);

      // Masculine coordinates (V-Taper: broad shoulders/lats, wide chest, athletic tapered waist, compact hips)
      return {
        neckW: 15 * sNeck,
        shW: 65 * sShoulders,
        chestW: 46 * sChest,
        waistW: 28 * sWaist,
        hipW: 34 * sHips,
        armThick: 15 * sArm,
        thighThick: 18 * sThigh,
        calfThick: 14 * sCalf,
      };
    }
  }, [measurements, isFemale]);

  const { neckW, shW, chestW, waistW, hipW, armThick, thighThick, calfThick } = scales;

  // Accurately positioned markers tracking the dynamic anatomical points
  const markers = useMemo(() => {
    if (isFemale) {
      return [
        {
          key: "neck" as BodyPartKey,
          label: "Pescoço",
          value: measurements.neck,
          unit: "cm",
          startX: cx + neckW,
          startY: 80,
          align: "right",
          targetX: 238,
          targetY: 80,
        },
        {
          key: "shoulders" as BodyPartKey,
          label: "Ombros",
          value: measurements.shoulders,
          unit: "cm",
          startX: cx - shW + 2,
          startY: 110,
          align: "left",
          targetX: 62,
          targetY: 110,
        },
        {
          key: "chest" as BodyPartKey,
          label: "Peitoral",
          value: measurements.chest,
          unit: "cm",
          // Feminine bust curve anchor
          startX: cx + (chestW * 0.7),
          startY: 148,
          align: "right",
          targetX: 238,
          targetY: 148,
        },
        {
          key: "arms" as BodyPartKey,
          label: "Braços",
          value: measurements.rightArm || measurements.leftArm,
          unit: "cm",
          startX: cx - shW - (armThick * 0.3),
          startY: 194,
          align: "left",
          targetX: 62,
          targetY: 194,
        },
        {
          key: "waist" as BodyPartKey,
          label: "Cintura",
          value: measurements.waist,
          unit: "cm",
          // Feminine narrow waist anchor
          startX: cx + waistW,
          startY: 226,
          align: "right",
          targetX: 238,
          targetY: 226,
        },
        {
          key: "hips" as BodyPartKey,
          label: "Quadril",
          value: measurements.hips,
          unit: "cm",
          // Curving feminine hip flare
          startX: cx - hipW,
          startY: 276,
          align: "left",
          targetX: 62,
          targetY: 276,
        },
        {
          key: "thighs" as BodyPartKey,
          label: "Coxas",
          value: measurements.rightThigh || measurements.leftThigh,
          unit: "cm",
          startX: cx + 15 + (thighThick * 0.45),
          startY: 348,
          align: "right",
          targetX: 238,
          targetY: 348,
        },
        {
          key: "calves" as BodyPartKey,
          label: "Panturrilhas",
          value: measurements.calves,
          unit: "cm",
          startX: cx - 13 - (calfThick * 0.45),
          startY: 440,
          align: "left",
          targetX: 62,
          targetY: 440,
        },
      ];
    } else {
      return [
        {
          key: "neck" as BodyPartKey,
          label: "Pescoço",
          value: measurements.neck,
          unit: "cm",
          startX: cx + neckW,
          startY: 75,
          align: "right",
          targetX: 238,
          targetY: 75,
        },
        {
          key: "shoulders" as BodyPartKey,
          label: "Ombros",
          value: measurements.shoulders,
          unit: "cm",
          startX: cx - shW + 2,
          startY: 104,
          align: "left",
          targetX: 62,
          targetY: 104,
        },
        {
          key: "chest" as BodyPartKey,
          label: "Peitoral",
          value: measurements.chest,
          unit: "cm",
          startX: cx + (chestW * 0.55),
          startY: 144,
          align: "right",
          targetX: 238,
          targetY: 144,
        },
        {
          key: "arms" as BodyPartKey,
          label: "Braços",
          value: measurements.rightArm || measurements.leftArm,
          unit: "cm",
          startX: cx - shW - (armThick * 0.25),
          startY: 190,
          align: "left",
          targetX: 62,
          targetY: 190,
        },
        {
          key: "waist" as BodyPartKey,
          label: "Cintura",
          value: measurements.waist,
          unit: "cm",
          startX: cx + waistW,
          startY: 232,
          align: "right",
          targetX: 238,
          targetY: 232,
        },
        {
          key: "hips" as BodyPartKey,
          label: "Quadril",
          value: measurements.hips,
          unit: "cm",
          startX: cx - hipW,
          startY: 278,
          align: "left",
          targetX: 62,
          targetY: 278,
        },
        {
          key: "thighs" as BodyPartKey,
          label: "Coxas",
          value: measurements.rightThigh || measurements.leftThigh,
          unit: "cm",
          startX: cx + 16 + (thighThick * 0.45),
          startY: 350,
          align: "right",
          targetX: 238,
          targetY: 350,
        },
        {
          key: "calves" as BodyPartKey,
          label: "Panturrilhas",
          value: measurements.calves,
          unit: "cm",
          startX: cx - 14 - (calfThick * 0.45),
          startY: 440,
          align: "left",
          targetX: 62,
          targetY: 440,
        },
      ];
    }
  }, [measurements, isFemale, cx, neckW, shW, chestW, waistW, hipW, armThick, thighThick, calfThick]);

  // FEMALE ATHLETIC SILHOUETTE PATHS
  const femaleUpperBodyPath = useMemo(() => {
    // Outer arm coordinates
    const lShX = cx - shW;
    const rShX = cx + shW;
    const lBicepX = cx - shW - armThick;
    const rBicepX = cx + shW + armThick;
    const lForearmX = cx - shW - (armThick * 0.8);
    const rForearmX = cx + shW + (armThick * 0.8);
    const lWristX = cx - shW - 2;
    const rWristX = cx + shW + 2;

    // Inner arm & armpit
    const lArmpitX = cx - (chestW * 0.95);
    const rArmpitX = cx + (chestW * 0.95);
    const lInnerElbowX = cx - shW + 9;
    const rInnerElbowX = cx + shW - 9;
    const lInnerWristX = cx - shW + 10;
    const rInnerWristX = cx + shW - 10;

    return `
      M ${cx} 26
      C ${cx + 14} 26, ${cx + 15} 35, ${cx + 14} 50
      C ${cx + 13} 62, ${cx + 9} 68, ${cx + neckW} 74
      C ${cx + neckW} 88, ${cx + neckW + 8} 98, ${rShX} 110
      C ${rShX + (armThick * 0.3)} 114, ${rBicepX} 145, ${rBicepX - 2} 184
      C ${rBicepX - 3} 204, ${rForearmX} 228, ${rWristX} 255
      C ${rWristX - 2} 257, ${rInnerWristX} 257, ${rInnerWristX} 253
      C ${rInnerWristX - 1} 226, ${rInnerElbowX} 196, ${rArmpitX} 168
      C ${cx + chestW + 4} 176, ${cx + (chestW * 0.85)} 194, ${cx + waistW} 226
      C ${cx + (waistW * 0.92)} 246, ${cx + hipW} 264, ${cx + hipW} 282
      C ${cx + (hipW * 0.85)} 302, ${cx + 10} 318, ${cx} 318
      C ${cx - 10} 318, ${cx - (hipW * 0.85)} 302, ${cx - hipW} 282
      C ${cx - hipW} 264, ${cx - (waistW * 0.92)} 246, ${cx - waistW} 226
      C ${cx - (chestW * 0.85)} 194, ${cx - chestW - 4} 176, ${lArmpitX} 168
      C ${lInnerElbowX} 196, ${lInnerWristX - 1} 226, ${lInnerWristX} 253
      C ${lInnerWristX} 257, ${lWristX - 2} 257, ${lWristX} 255
      C ${lForearmX} 228, ${lBicepX - 3} 204, ${lBicepX - 2} 184
      C ${lBicepX} 145, ${lShX - (armThick * 0.3)} 114, ${lShX} 110
      C ${cx - neckW - 8} 98, ${cx - neckW} 88, ${cx - neckW} 74
      C ${cx - 9} 68, ${cx - 13} 62, ${cx - 14} 50
      C ${cx - 15} 35, ${cx - 14} 26, ${cx} 26 Z
    `;
  }, [cx, neckW, shW, chestW, waistW, hipW, armThick]);

  const femaleLegsPath = useMemo(() => {
    const lThighX = cx - 12 - thighThick;
    const rThighX = cx + 12 + thighThick;
    const lKneeX = cx - 13 - (thighThick * 0.5);
    const rKneeX = cx + 13 + (thighThick * 0.5);
    const lCalfX = cx - 12 - calfThick;
    const rCalfX = cx + 12 + calfThick;
    const lAnkleX = cx - 13;
    const rAnkleX = cx + 13;

    return `
      M ${cx - hipW} 282
      C ${cx - hipW - 2} 300, ${lThighX} 334, ${lThighX} 358
      C ${lThighX + 1} 382, ${lKneeX} 398, ${lKneeX} 408
      C ${lKneeX - 1} 418, ${lCalfX} 436, ${lCalfX + 1} 454
      C ${lCalfX + 3} 470, ${lAnkleX - 2} 484, ${lAnkleX} 494
      C ${lAnkleX + 4} 495, ${cx - 6} 495, ${cx - 6} 490
      C ${cx - 5} 474, ${cx - 4} 444, ${cx - 4} 412
      C ${cx - 3} 382, ${cx - 2} 348, ${cx} 318
      C ${cx + 2} 348, ${cx + 3} 382, ${cx + 4} 412
      C ${cx + 4} 444, ${cx + 5} 474, ${cx + 6} 490
      C ${cx + 6} 495, ${rAnkleX + 4} 495, ${rAnkleX} 494
      C ${rAnkleX - 2} 484, ${rCalfX + 3} 470, ${rCalfX + 1} 454
      C ${rCalfX} 436, ${rKneeX - 1} 418, ${rKneeX} 408
      C ${rKneeX} 398, ${rThighX + 1} 382, ${rThighX} 358
      C ${rThighX} 334, ${cx + hipW - 2} 300, ${cx + hipW} 282
      Z
    `;
  }, [cx, hipW, thighThick, calfThick]);

  // MALE ATHLETIC SILHOUETTE PATHS
  const maleUpperBodyPath = useMemo(() => {
    const lShX = cx - shW;
    const rShX = cx + shW;
    const lBicepX = cx - shW - armThick;
    const rBicepX = cx + shW + armThick;
    const lForearmX = cx - shW - (armThick * 0.88);
    const rForearmX = cx + shW + (armThick * 0.88);
    const lWristX = cx - shW - 2;
    const rWristX = cx + shW + 2;

    const lArmpitX = cx - chestW;
    const rArmpitX = cx + chestW;
    const lInnerElbowX = cx - shW + 11;
    const rInnerElbowX = cx + shW - 11;
    const lInnerWristX = cx - shW + 13;
    const rInnerWristX = cx + shW - 13;

    return `
      M ${cx} 24
      C ${cx + 17} 24, ${cx + 18} 36, ${cx + 16} 52
      C ${cx + 15} 64, ${cx + 12} 69, ${cx + neckW} 74
      C ${cx + neckW + 4} 84, ${cx + neckW + 14} 94, ${rShX} 104
      C ${rShX + (armThick * 0.4)} 108, ${rBicepX} 144, ${rBicepX - 2} 185
      C ${rBicepX - 3} 205, ${rForearmX} 230, ${rWristX} 256
      C ${rWristX - 3} 258, ${rInnerWristX} 258, ${rInnerWristX} 254
      C ${rInnerWristX - 1} 228, ${rInnerElbowX} 195, ${rArmpitX} 168
      C ${cx + chestW + 2} 175, ${cx + (chestW * 0.8)} 195, ${cx + waistW} 232
      C ${cx + (waistW * 0.95)} 252, ${cx + hipW} 268, ${cx + hipW} 285
      C ${cx + (hipW * 0.8)} 305, ${cx + 10} 318, ${cx} 318
      C ${cx - 10} 318, ${cx - (hipW * 0.8)} 305, ${cx - hipW} 285
      C ${cx - hipW} 268, ${cx - (waistW * 0.95)} 252, ${cx - waistW} 232
      C ${cx - (chestW * 0.8)} 195, ${cx - chestW - 2} 175, ${lArmpitX} 168
      C ${lInnerElbowX} 195, ${lInnerWristX - 1} 228, ${lInnerWristX} 254
      C ${lInnerWristX} 258, ${lWristX - 3} 258, ${lWristX} 256
      C ${lForearmX} 230, ${lBicepX - 3} 205, ${lBicepX - 2} 185
      C ${lBicepX} 144, ${lShX - (armThick * 0.4)} 108, ${lShX} 104
      C ${cx - neckW - 14} 94, ${cx - neckW - 4} 84, ${cx - neckW} 74
      C ${cx - 12} 69, ${cx - 15} 64, ${cx - 16} 52
      C ${cx - 18} 36, ${cx - 17} 24, ${cx} 24 Z
    `;
  }, [cx, neckW, shW, chestW, waistW, hipW, armThick]);

  const maleLegsPath = useMemo(() => {
    const lThighX = cx - 14 - thighThick;
    const rThighX = cx + 14 + thighThick;
    const lKneeX = cx - 14 - (thighThick * 0.6);
    const rKneeX = cx + 14 + (thighThick * 0.6);
    const lCalfX = cx - 13 - calfThick;
    const rCalfX = cx + 13 + calfThick;
    const lAnkleX = cx - 14;
    const rAnkleX = cx + 14;

    return `
      M ${cx - hipW} 285
      C ${cx - hipW - 2} 302, ${lThighX} 338, ${lThighX} 360
      C ${lThighX + 1} 385, ${lKneeX} 400, ${lKneeX} 408
      C ${lKneeX - 1} 418, ${lCalfX} 438, ${lCalfX + 2} 456
      C ${lCalfX + 4} 472, ${lAnkleX - 2} 484, ${lAnkleX} 494
      C ${lAnkleX + 4} 495, ${cx - 7} 495, ${cx - 7} 490
      C ${cx - 6} 475, ${cx - 5} 445, ${cx - 4} 412
      C ${cx - 4} 385, ${cx - 3} 350, ${cx} 318
      C ${cx + 3} 350, ${cx + 4} 385, ${cx + 4} 412
      C ${cx + 5} 445, ${cx + 6} 475, ${cx + 7} 490
      C ${cx + 7} 495, ${rAnkleX + 4} 495, ${rAnkleX} 494
      C ${rAnkleX - 2} 484, ${rCalfX + 4} 472, ${rCalfX + 2} 456
      C ${rCalfX} 438, ${rKneeX - 1} 418, ${rKneeX} 408
      C ${rKneeX} 400, ${rThighX + 1} 385, ${rThighX} 360
      C ${rThighX} 338, ${cx + hipW - 2} 302, ${cx + hipW} 285
      Z
    `;
  }, [cx, hipW, thighThick, calfThick]);

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center select-none py-2">
      <svg
        viewBox="0 0 300 520"
        className="w-full h-auto max-h-[490px] drop-shadow-2xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Ambient Body Shading Gradients */}
          <linearGradient id="bodyGradMale2D" x1="150" y1="20" x2="150" y2="500" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2c303c" />
            <stop offset="50%" stopColor="#1e222a" />
            <stop offset="100%" stopColor="#14161c" />
          </linearGradient>
          <linearGradient id="bodyGradFemale2D" x1="150" y1="20" x2="150" y2="500" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2d313d" />
            <stop offset="50%" stopColor="#20232c" />
            <stop offset="100%" stopColor="#15171e" />
          </linearGradient>
          <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Floor Shadow / Studio Light */}
        <ellipse cx="150" cy="502" rx="96" ry="10" fill="#007AFF" opacity="0.08" filter="url(#subtleGlow)" />
        <ellipse cx="150" cy="502" rx="60" ry="5" fill="#ffffff" opacity="0.05" />

        {/* Dynamic 2D Anatomical Body Silhouette */}
        {isFemale ? (
          /* FEMININE ATHLETIC BODY */
          <g className="transition-all duration-300">
            {/* Feminine Hair Topknot/Bun for clear distinct visual identity */}
            <circle cx={cx} cy="18" r="8" fill="#2d313d" stroke="#3f4553" strokeWidth="1.2" />
            <ellipse cx={cx + 5} cy="19" rx="5" ry="7" fill="#242833" opacity="0.6" />

            {/* Upper Body (Torso, Slender Arms, Narrow Neck, Bust) */}
            <path
              d={femaleUpperBodyPath}
              fill="url(#bodyGradFemale2D)"
              stroke="#444b5c"
              strokeWidth="1.3"
              className="transition-all duration-300"
            />

            {/* Lower Body (Hourglass Hips, Curved Thighs, Calves) */}
            <path
              d={femaleLegsPath}
              fill="url(#bodyGradFemale2D)"
              stroke="#444b5c"
              strokeWidth="1.3"
              className="transition-all duration-300"
            />

            {/* Feminine Delicate Clavicles */}
            <path
              d={`M ${cx - (neckW * 0.9)} 100 C ${cx - 14} 104, ${cx - 6} 104, ${cx} 104 C ${cx + 6} 104, ${cx + 14} 104, ${cx + (neckW * 0.9)} 100`}
              stroke="#5a6378"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Feminine Bust Curves (Distinct breast silhouette and cleavage contours) */}
            <path
              d={`M ${cx - (chestW * 0.88)} 140 C ${cx - (chestW * 0.42)} 162, ${cx - 4} 158, ${cx - 2} 144`}
              stroke="#5a6378"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d={`M ${cx + (chestW * 0.88)} 140 C ${cx + (chestW * 0.42)} 162, ${cx + 4} 158, ${cx + 2} 144`}
              stroke="#5a6378"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d={`M ${cx - 1} 138 C ${cx - 2} 146, ${cx + 2} 146, ${cx + 1} 138`}
              stroke="#5a6378"
              strokeWidth="0.8"
              opacity="0.5"
            />

            {/* Soft Navel and subtle tummy line */}
            <circle cx={cx} cy="230" r="1.4" fill="#5a6378" opacity="0.8" />
            <path
              d={`M ${cx} 238 C ${cx - 1} 248, ${cx + 1} 248, ${cx} 238`}
              stroke="#5a6378"
              strokeWidth="0.8"
              opacity="0.3"
            />

            {/* Knee cap contours */}
            <ellipse cx={cx - 12 - (thighThick * 0.25)} cy="404" rx="4" ry="5" stroke="#5a6378" strokeWidth="0.8" opacity="0.35" fill="none" />
            <ellipse cx={cx + 12 + (thighThick * 0.25)} cy="404" rx="4" ry="5" stroke="#5a6378" strokeWidth="0.8" opacity="0.35" fill="none" />
          </g>
        ) : (
          /* MASCULINE ATHLETIC BODY */
          <g className="transition-all duration-300">
            {/* Upper Body (Broad Shoulders, Strong Neck, Pecs, V-Taper Lats) */}
            <path
              d={maleUpperBodyPath}
              fill="url(#bodyGradMale2D)"
              stroke="#3f4553"
              strokeWidth="1.3"
              className="transition-all duration-300"
            />

            {/* Lower Body (Athletic Quads, Calves) */}
            <path
              d={maleLegsPath}
              fill="url(#bodyGradMale2D)"
              stroke="#3f4553"
              strokeWidth="1.3"
              className="transition-all duration-300"
            />

            {/* Clavicles */}
            <path
              d={`M ${cx - (neckW * 0.95)} 96 C ${cx - 20} 102, ${cx - 8} 102, ${cx} 102 C ${cx + 8} 102, ${cx + 20} 102, ${cx + (neckW * 0.95)} 96`}
              stroke="#525b6e"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Pectoral Contours */}
            <path
              d={`M ${cx - (chestW * 0.88)} 142 C ${cx - (chestW * 0.4)} 152, ${cx - 4} 150, ${cx - 2} 140`}
              stroke="#525b6e"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d={`M ${cx + (chestW * 0.88)} 142 C ${cx + (chestW * 0.4)} 152, ${cx + 4} 150, ${cx + 2} 140`}
              stroke="#525b6e"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Sternum / Linea Alba & Navel */}
            <line x1={cx} y1="140" x2={cx} y2="242" stroke="#525b6e" strokeWidth="0.8" opacity="0.4" />
            <circle cx={cx} cy="230" r="1.6" fill="#525b6e" opacity="0.8" />

            {/* Abdominal Muscle Definition for Men */}
            <path
              d={`M ${cx - 15} 174 C ${cx - 6} 177, ${cx + 6} 177, ${cx + 15} 174`}
              stroke="#525b6e"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d={`M ${cx - 15} 200 C ${cx - 6} 203, ${cx + 6} 203, ${cx + 15} 200`}
              stroke="#525b6e"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d={`M ${cx - 14} 250 C ${cx - 6} 258, ${cx + 6} 258, ${cx + 14} 250`}
              stroke="#525b6e"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.4"
            />

            {/* Knee cap contours */}
            <ellipse cx={cx - 13 - (thighThick * 0.3)} cy="404" rx="4.5" ry="5.5" stroke="#525b6e" strokeWidth="0.8" opacity="0.4" fill="none" />
            <ellipse cx={cx + 13 + (thighThick * 0.3)} cy="404" rx="4.5" ry="5.5" stroke="#525b6e" strokeWidth="0.8" opacity="0.4" fill="none" />
          </g>
        )}

        {/* Highlight Zone Glow When Active */}
        {activePart === "neck" && (
          <ellipse cx={cx} cy={isFemale ? 80 : 75} rx={neckW + 4} ry="12" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
        )}
        {activePart === "shoulders" && (
          <>
            <ellipse cx={cx - shW + 4} cy={isFemale ? 110 : 104} rx="14" ry="14" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
            <ellipse cx={cx + shW - 4} cy={isFemale ? 110 : 104} rx="14" ry="14" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
          </>
        )}
        {activePart === "chest" && (
          <ellipse cx={cx} cy={isFemale ? 148 : 144} rx={chestW * 0.75} ry="16" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
        )}
        {activePart === "arms" && (
          <>
            <ellipse cx={cx - shW - (armThick * 0.25)} cy={isFemale ? 194 : 190} rx={armThick * 0.8} ry="26" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
            <ellipse cx={cx + shW + (armThick * 0.25)} cy={isFemale ? 194 : 190} rx={armThick * 0.8} ry="26" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
          </>
        )}
        {activePart === "waist" && (
          <ellipse cx={cx} cy={isFemale ? 226 : 232} rx={waistW + 4} ry="14" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
        )}
        {activePart === "hips" && (
          <ellipse cx={cx} cy={isFemale ? 276 : 278} rx={hipW + 4} ry="16" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
        )}
        {activePart === "thighs" && (
          <>
            <ellipse cx={cx - (isFemale ? 13 : 15) - (thighThick * 0.4)} cy="350" rx={thighThick * 0.65} ry="32" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
            <ellipse cx={cx + (isFemale ? 13 : 15) + (thighThick * 0.4)} cy="350" rx={thighThick * 0.65} ry="32" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
          </>
        )}
        {activePart === "calves" && (
          <>
            <ellipse cx={cx - (isFemale ? 13 : 14) - (calfThick * 0.45)} cy="440" rx={calfThick * 0.65} ry="26" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
            <ellipse cx={cx + (isFemale ? 13 : 14) + (calfThick * 0.45)} cy="440" rx={calfThick * 0.65} ry="26" fill="#007AFF" opacity="0.3" filter="url(#subtleGlow)" />
          </>
        )}

        {/* Precision Lines & Pointer Dots Directly on Anatomical Landmarks */}
        {markers.map((marker) => {
          const isActive = activePart === marker.key;
          const { startX, startY, targetX, targetY } = marker;

          return (
            <g
              key={marker.key}
              onClick={() => onSelectPart(marker.key)}
              className="cursor-pointer group"
            >
              {/* Connecting line between anatomical location and side label */}
              <line
                x1={startX}
                y1={startY}
                x2={targetX}
                y2={targetY}
                stroke={isActive ? "#007AFF" : "#454c5e"}
                strokeWidth={isActive ? "1.8" : "1"}
                strokeDasharray={isActive ? "none" : "3,3"}
                className="transition-colors duration-200 group-hover:stroke-[#007AFF]"
              />

              {/* Exact Pinpoint Dot on the anatomical body part */}
              <circle
                cx={startX}
                cy={startY}
                r={isActive ? 4 : 2.5}
                fill={isActive ? "#007AFF" : "#71717a"}
                className="transition-all duration-200 group-hover:fill-[#007AFF] group-hover:r-3.5"
              />

              {/* Target Dot at label boundary */}
              <circle
                cx={targetX}
                cy={targetY}
                r={isActive ? 3.5 : 2}
                fill={isActive ? "#007AFF" : "#52525b"}
                className="transition-all duration-200 group-hover:fill-[#007AFF]"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Interactive Callout Badges around the Silhouette */}
      <div className="absolute inset-0 pointer-events-none">
        {markers.map((m) => {
          const isActive = activePart === m.key;
          const isLeft = m.align === "left";
          const topPercent = (m.targetY / 520) * 100;

          return (
            <div
              key={m.key}
              style={{
                top: `${topPercent}%`,
                left: isLeft ? "2%" : "auto",
                right: !isLeft ? "2%" : "auto",
                transform: "translateY(-50%)",
              }}
              className="absolute pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => onSelectPart(m.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer border ${
                  isActive
                    ? "bg-[#007AFF] text-white border-[#007AFF] shadow-blue-500/25 scale-105"
                    : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <span className="text-[11px] font-medium opacity-85">{m.label}</span>
                <span className="font-black text-[12px]">
                  {m.value ? `${m.value}${m.unit}` : "—"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
