import { colors } from '../constants';

export const QuarryLogo = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
    <rect width="512" height="512" rx="112" fill={colors.textPrimary} />
    <circle cx="352" cy="154" r="86" fill={colors.primary} />
    <path
      fill={colors.bgDark}
      d="M106 182c0-45 68-78 150-78s150 33 150 78v152c0 45-68 78-150 78s-150-33-150-78V182Z"
    />
    <ellipse cx="256" cy="182" rx="150" ry="64" fill={colors.bgDark} />
    <ellipse cx="256" cy="176" rx="104" ry="34" fill={colors.primary} />
    <path
      d="M132 246c28 24 74 38 124 38s96-14 124-38"
      fill="none"
      stroke={colors.textPrimary}
      strokeWidth="18"
      strokeLinecap="round"
      opacity=".74"
    />
    <path
      d="M132 308c28 24 74 38 124 38s96-14 124-38"
      fill="none"
      stroke={colors.textPrimary}
      strokeWidth="18"
      strokeLinecap="round"
      opacity=".30"
    />
    <rect
      x="150"
      y="360"
      width="62"
      height="24"
      rx="12"
      fill={colors.textPrimary}
    />
    <rect
      x="232"
      y="360"
      width="92"
      height="24"
      rx="12"
      fill={colors.primary}
    />
    <rect
      x="344"
      y="360"
      width="40"
      height="24"
      rx="12"
      fill={colors.textPrimary}
      opacity=".82"
    />
    <rect
      x="18"
      y="18"
      width="476"
      height="476"
      rx="102"
      fill="none"
      stroke={colors.bgDark}
      strokeOpacity=".08"
      strokeWidth="4"
    />
  </svg>
);
