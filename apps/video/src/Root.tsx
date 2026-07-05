import { Composition, Folder } from 'remotion';
import { FPS, TOTAL_DURATION } from './constants';
import { PromoVideo } from './PromoVideo';

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
          title: 'Quarry',
          tagline: 'The database manager developers love.',
        }}
      />
    </Folder>
  );
};
