import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import * as React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { FeatureScene } from './components/FeatureScene';
import { IntroScene } from './components/IntroScene';
import { OutroScene } from './components/OutroScene';
import {
  FEATURE_DURATION_S,
  features,
  INTRO_DURATION_S,
  OUTRO_DURATION_S,
  seconds,
  TRANSITION_DURATION_S,
} from './constants';

export interface PromoVideoProps {
  title?: string;
  tagline?: string;
}

export const PromoVideo = ({
  title = 'Quarry',
  tagline = 'The database manager developers love.',
}: PromoVideoProps) => {
  const { fps } = useVideoConfig();

  // Timing configuration (derived from shared constants)
  const introDuration = seconds(INTRO_DURATION_S);
  const featureDuration = seconds(FEATURE_DURATION_S);
  const outroDuration = seconds(OUTRO_DURATION_S);
  const transitionDuration = Math.round(TRANSITION_DURATION_S * fps);

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
