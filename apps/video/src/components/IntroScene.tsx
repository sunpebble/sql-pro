import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, fonts } from '../constants';

interface IntroSceneProps {
  title: string;
  tagline: string;
}

export const IntroScene = ({ title, tagline }: IntroSceneProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Title animation (delayed)
  const titleProgress = spring({
    frame,
    fps,
    delay: 20,
    config: { damping: 200 },
  });

  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  // Tagline animation (more delayed)
  const taglineProgress = spring({
    frame,
    fps,
    delay: 35,
    config: { damping: 200 },
  });

  const taglineY = interpolate(taglineProgress, [0, 1], [30, 0]);
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);

  // Exit animation
  const exitProgress = spring({
    frame,
    fps,
    delay: durationInFrames - fps,
    config: { damping: 200 },
  });

  const containerOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const containerScale = interpolate(exitProgress, [0, 1], [1, 0.95]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bgDarker,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: containerOpacity,
        transform: `scale(${containerScale})`,
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${colors.primary}15 0%, transparent 50%)`,
        }}
      />

      {/* Grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        {/* Database Icon */}
        <svg
          width={120}
          height={120}
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.primary}
          strokeWidth={1.5}
        >
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5V19A9 3 0 0 0 21 19V5" />
          <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>

        {/* Title */}
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 96,
            fontWeight: 800,
            color: colors.textPrimary,
            margin: 0,
            letterSpacing: '-0.03em',
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
          }}
        >
          {title}
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: 32,
            fontWeight: 500,
            color: colors.textSecondary,
            margin: 0,
            transform: `translateY(${taglineY}px)`,
            opacity: taglineOpacity,
          }}
        >
          {tagline}
        </p>
      </div>
    </AbsoluteFill>
  );
};
