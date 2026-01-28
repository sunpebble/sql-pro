import { Composition, Folder } from 'remotion';
import { FPS, seconds } from './constants';
import { PromoVideo } from './PromoVideo';

// Calculate total duration based on scenes
// Intro(5s) + 3 Features(8s each) + Outro(6s) - 4 transitions(0.8s each)
const INTRO_DURATION = seconds(5);
const FEATURE_DURATION = seconds(8);
const FEATURE_COUNT = 3;
const OUTRO_DURATION = seconds(6);
const TRANSITION_DURATION = Math.round(0.8 * FPS);
const TRANSITION_COUNT = 4;

const TOTAL_DURATION =
  INTRO_DURATION +
  FEATURE_DURATION * FEATURE_COUNT +
  OUTRO_DURATION -
  TRANSITION_DURATION * TRANSITION_COUNT;

export const RemotionRoot = () => {
  return (
    <Folder name="SQL-Pro">
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'SQL Pro',
          tagline: 'The database manager developers love.',
        }}
      />
    </Folder>
  );
};
