import { useEffect, useState } from 'react';
import './Download.css';

type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

const detectPlatform = (): Platform => {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
};

const platforms = {
  mac: {
    name: 'macOS',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    file: 'sql-pro-x.x.x-universal.dmg',
    arch: 'Universal (M1/M2/M3/M4 + Intel)',
  },
  windows: {
    name: 'Windows',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    ),
    file: 'sql-pro-x.x.x-setup.exe',
    arch: 'x64',
  },
  linux: {
    name: 'Linux',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105c-.009.097-.016.19-.038.29-.078.32-.18.654-.345 1.027-.09.201-.2.41-.304.604-.104.2-.22.38-.369.507-.158.135-.357.241-.553.268-.09.02-.184.027-.283.027-.197 0-.39-.037-.58-.116-.19-.073-.385-.2-.545-.394-.16-.19-.297-.445-.376-.712-.08-.27-.107-.56-.066-.825.036-.27.116-.535.239-.78.121-.248.288-.473.487-.661.2-.19.438-.333.698-.422.265-.09.534-.135.814-.135zm-2.648.543c-.14.01-.268.067-.375.165-.116.106-.197.248-.241.397-.12.335-.088.777.108 1.233.196.458.523.857.946 1.11.424.255.88.373 1.287.4.406.026.764-.05 1.024-.205.27-.153.447-.381.497-.627.05-.246-.009-.52-.108-.793-.2-.553-.663-1.147-1.31-1.534l-.264-.126c-.326-.153-.664-.2-.992-.19zm8.016.113c.23.003.435.076.614.23.184.156.33.396.425.723.094.329.13.696.1 1.095-.04.395-.116.74-.23 1.055-.112.312-.283.6-.486.81-.22.216-.497.37-.804.396-.3.031-.61-.024-.893-.155-.28-.132-.54-.358-.752-.646l.003-.003a3.043 3.043 0 01-.503-.953 2.667 2.667 0 01-.117-1.034c.034-.344.13-.658.284-.927.153-.268.373-.498.604-.634.23-.14.48-.2.73-.194zm-5.114 3.42-.264.153c-.325.192-.58.473-.765.84a2.293 2.293 0 00-.262 1.082c.002.298.056.596.162.874.116.287.292.551.52.769.233.218.512.387.82.496.303.103.624.169.947.164.321-.008.63-.074.91-.203a1.67 1.67 0 00.689-.543c.162-.22.285-.481.369-.762.09-.269.133-.55.131-.836 0-.282-.036-.582-.116-.868a2.386 2.386 0 00-.397-.804c.003.005-.174-.205-.324-.32-.15-.106-.314-.192-.486-.258-.336-.126-.692-.174-1.05-.162-.354.011-.715.07-1.053.178a3.47 3.47 0 00-.831.4z" />
      </svg>
    ),
    file: 'sql-pro-x.x.x.AppImage',
    arch: 'x64 (AppImage / deb)',
  },
  unknown: {
    name: '下载',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    file: '',
    arch: '所有平台',
  },
};

export default function Download() {
  const [platform, setPlatform] = useState<Platform>('unknown');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const currentPlatform = platforms[platform];
  const otherPlatforms = Object.entries(platforms).filter(
    ([key]) => key !== platform && key !== 'unknown'
  );

  return (
    <section className="download" id="download">
      <div className="container">
        <div className="download-glow" />

        <div className="download-content">
          <h2 className="download-title">
            立即开始使用 <span className="gradient-text">SQL Pro</span>
          </h2>
          <p className="download-subtitle">免费下载，跨平台支持</p>

          <a
            href="https://github.com/kunish-homelab/sql-pro/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-lg btn-download download-main"
          >
            {currentPlatform.icon}
            <span>
              下载 {currentPlatform.name} 版本
              <small>{currentPlatform.arch}</small>
            </span>
          </a>

          <div className="download-other">
            <span>其他平台：</span>
            {otherPlatforms.map(([key, info]) => (
              <a
                key={key}
                href="https://github.com/kunish-homelab/sql-pro/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="download-link"
                title={info.arch}
              >
                {info.icon}
                {info.name}
              </a>
            ))}
          </div>

          <p className="download-note">
            需要源码编译？查看{' '}
            <a
              href="https://github.com/kunish-homelab/sql-pro#build-from-source"
              target="_blank"
              rel="noopener noreferrer"
            >
              构建指南
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
