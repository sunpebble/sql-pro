import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import * as React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { FeatureScene } from './components/FeatureScene';
import { IntroScene } from './components/IntroScene';
import { OutroScene } from './components/OutroScene';
import { seconds } from './constants';

export interface PromoVideoProps {
  title: string;
  tagline: string;
}

// Feature data for showcasing
const features = [
  {
    title: 'Smart Query Editor',
    description:
      'Monaco editor with SQL syntax highlighting, autocomplete, Vim mode, and query history.',
    screenshot: 'screenshots/query-dark.png',
    align: 'left' as const,
  },
  {
    title: 'Visual Data Editing',
    description:
      'Inline editing with diff preview. See exactly what changed before saving.',
    screenshot: 'screenshots/table-dark.png',
    align: 'right' as const,
  },
  {
    title: 'Multi-Database Support',
    description:
      'SQLite, SQLCipher encryption. Open multiple databases in tabs.',
    screenshot: 'screenshots/database-dark.png',
    align: 'left' as const,
  },
];

export const PromoVideo = ({ title, tagline }: PromoVideoProps) => {
  const { fps } = useVideoConfig();

  // Timing configuration
  const introDuration = seconds(5);
  const featureDuration = seconds(8);
  const outroDuration = seconds(6);
  const transitionDuration = Math.round(0.8 * fps); // 0.8 seconds

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {/* Intro */}
        <TransitionSeries.Sequence durationInFrames={introDuration}>
          <IntroScene title={title} tagline={tagline} />
        </TransitionSeries.Sequence>

        {/* Transition to first feature */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Features */}
        {features.map((feature, index) => (
          <React.Fragment key={feature.title}>
            <TransitionSeries.Sequence durationInFrames={featureDuration}>
              <FeatureScene
                title={feature.title}
                description={feature.description}
                screenshot={feature.screenshot}
                align={feature.align}
              />
            </TransitionSeries.Sequence>

            <TransitionSeries.Transition
              presentation={slide({
                direction: index % 2 === 0 ? 'from-right' : 'from-left',
              })}
              timing={linearTiming({ durationInFrames: transitionDuration })}
            />
          </React.Fragment>
        ))}

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={outroDuration}>
          <OutroScene title={title} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
