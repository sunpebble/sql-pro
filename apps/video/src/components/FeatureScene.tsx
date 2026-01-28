import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, fonts } from '../constants';

interface FeatureSceneProps {
  title: string;
  description: string;
  screenshot: string;
  align: 'left' | 'right';
}

export const FeatureScene = ({
  title,
  description,
  screenshot,
  align,
}: FeatureSceneProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Content entrance animation
  const contentProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const contentX = interpolate(
    contentProgress,
    [0, 1],
    [align === 'left' ? -60 : 60, 0]
  );
  const contentOpacity = interpolate(contentProgress, [0, 1], [0, 1]);

  // Screenshot entrance (delayed, from opposite side)
  const screenshotProgress = spring({
    frame,
    fps,
    delay: 10,
    config: { damping: 200 },
  });

  const screenshotX = interpolate(
    screenshotProgress,
    [0, 1],
    [align === 'left' ? 80 : -80, 0]
  );
  const screenshotOpacity = interpolate(screenshotProgress, [0, 1], [0, 1]);
  const screenshotScale = interpolate(screenshotProgress, [0, 1], [0.9, 1]);

  // Title highlight animation
  const highlightWidth = interpolate(frame, [15, 40], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bgDark,
        display: 'flex',
        flexDirection: align === 'left' ? 'row' : 'row-reverse',
        alignItems: 'center',
        padding: 80,
        gap: 80,
      }}
    >
      {/* Content Side */}
      <div
        style={{
          flex: '0 0 400px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          transform: `translateX(${contentX}px)`,
          opacity: contentOpacity,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            backgroundColor: `${colors.primary}15`,
            border: `1px solid ${colors.primary}30`,
            borderRadius: 9999,
            width: 'fit-content',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: 600,
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Feature
          </span>
        </div>

        {/* Title with highlight */}
        <div style={{ position: 'relative' }}>
          <h2
            style={{
              fontFamily: fonts.display,
              fontSize: 48,
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>
          {/* Highlight underline */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: 0,
              width: `${highlightWidth}%`,
              height: 4,
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.accentCyan})`,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: 20,
            fontWeight: 400,
            color: colors.textSecondary,
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>
      </div>

      {/* Screenshot Side */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translateX(${screenshotX}px) scale(${screenshotScale})`,
          opacity: screenshotOpacity,
        }}
      >
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 60px ${colors.primary}20`,
            border: `1px solid ${colors.primary}30`,
          }}
        >
          <Img
            src={staticFile(screenshot)}
            style={{
              width: '100%',
              maxWidth: 900,
              display: 'block',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
