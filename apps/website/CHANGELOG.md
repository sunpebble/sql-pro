# Changelog

## [1.2.0](https://github.com/sunpebble/quarry/compare/quarry-website-v1.1.0...quarry-website-v1.2.0) (2026-07-05)


### Features

* **02-01:** align website text tokens with Slate palette ([642d35a](https://github.com/sunpebble/quarry/commit/642d35aaebf644d29ac600c47b65a9099ccb16b5))
* **09-01:** add primitive palette and restructure semantic tokens ([afdd289](https://github.com/sunpebble/quarry/commit/afdd2895faf33517acaf497b72100d9a66e7f4be))
* **09-01:** add Tailwind v4 [@theme](https://github.com/theme) inline integration ([45ccb97](https://github.com/sunpebble/quarry/commit/45ccb9747c9c87eca261eebf9f01e2f7113a0366))
* **10-01:** remove Pricing section and simplify hero copy ([8755b3e](https://github.com/sunpebble/quarry/commit/8755b3e1a36290dd15dfeae619f0939a7c434730))
* **10-01:** simplify hero section to screenshot-first design ([718aafc](https://github.com/sunpebble/quarry/commit/718aafcf51f879b431cb608b0ffe5ee07fe45f2e))
* **10-02:** implement bento grid layout for Features section ([d92bad6](https://github.com/sunpebble/quarry/commit/d92bad6191514a5424563f6ee879ec795be57263))
* **10-03:** minimize Footer to essential links only ([bd1c0fc](https://github.com/sunpebble/quarry/commit/bd1c0fce4c39ebc7abfdb2acb2bbc88e4e0537dd))
* **10-03:** streamline Download section to single CTA ([78b0cac](https://github.com/sunpebble/quarry/commit/78b0cacb970f7a8a64092d825e57e25972528e4f))
* **11-01:** add Features header scroll animation ([9a93a13](https://github.com/sunpebble/quarry/commit/9a93a13a3e9be69c4192047a1c5e657d84373e0f))
* **11-01:** create useInView hook and convert Download to scroll-triggered ([66b8c1b](https://github.com/sunpebble/quarry/commit/66b8c1b93875b84bc2879444abb78652d63118a4))
* **agent:** convert AI chat from modal to sidebar layout ([9f62dd2](https://github.com/sunpebble/quarry/commit/9f62dd2fcb9f516472c1ab2b332d6d38c4f8d163))
* **design:** unify design language across Electron and website ([#67](https://github.com/sunpebble/quarry/issues/67)) ([b3fb22a](https://github.com/sunpebble/quarry/commit/b3fb22a7f927b6f2fa9e585604f255c32c582473))
* migrate auto-update to Cloudflare R2 and enhance UI components ([4fd1684](https://github.com/sunpebble/quarry/commit/4fd1684d2ddc5bc76ca78b9181620d814047d0bf))
* migrate sql-pro to sunpebble branding ([887e371](https://github.com/sunpebble/quarry/commit/887e3716a34d8c3b4260f2a6d50f01d3158c06d7))
* **payment:** refactor license dialog to wizard-style flow with new components ([#60](https://github.com/sunpebble/quarry/issues/60)) ([fc64ff8](https://github.com/sunpebble/quarry/commit/fc64ff80fec1b21b5017e95d1df83f14713de850))
* **ui:** apply neobrutalism design system to UI components ([fec3639](https://github.com/sunpebble/quarry/commit/fec363992097a11938bd51b12a01268ae4bffb49))
* **ui:** comprehensive UI polish and micro-interactions ([651f4f3](https://github.com/sunpebble/quarry/commit/651f4f320eef5ed13a242d0ae91d165407cafee7))
* **ui:** implement Data Sanctum design system across application ([51bf362](https://github.com/sunpebble/quarry/commit/51bf362dea75077edc8f94065f58747b96f81323))
* **website:** add Pricing section with subscription plans ([6c9c5be](https://github.com/sunpebble/quarry/commit/6c9c5beb6a8170d78ef38ed712acc933ee56f834))
* **website:** add Remotion promo video and new landing page sections ([b46f81a](https://github.com/sunpebble/quarry/commit/b46f81ab46bfbc06c27ad1a65d9fc9a2819f41d5))
* **website:** connect pricing buttons to Stripe checkout ([3a0b856](https://github.com/sunpebble/quarry/commit/3a0b856b2a98864ba66042cf9e723d059bc7fd18))
* **website:** enhance SEO meta tags and improve marketing copy ([de4cafd](https://github.com/sunpebble/quarry/commit/de4cafde7828eb1cf9de57023aa758bb5e475d48))
* **website:** redesign with Fresh Modern design system ([#87](https://github.com/sunpebble/quarry/issues/87)) ([d92c178](https://github.com/sunpebble/quarry/commit/d92c17832338b7ad83be3a592c927377cf271e40))


### Bug Fixes

* **09-02:** migrate base styles to semantic tokens in index.css ([f535abc](https://github.com/sunpebble/quarry/commit/f535abc99a356ca36ce9bea92695bcdae15f5726))
* **11:** fix className template to properly add visible class ([b3fa4f3](https://github.com/sunpebble/quarry/commit/b3fa4f3b9659bb682a6394dc10a6749f1cc39070))
* ensure Monaco editor theme syncs before dark mode screenshot ([d494398](https://github.com/sunpebble/quarry/commit/d4943988d0a5febd7ca0262c3a29baccef909966))
* expose Monaco to window for screenshot theme synchronization ([bd2fc75](https://github.com/sunpebble/quarry/commit/bd2fc75b3e696b17a5f62a46f6b9ecffe961e518))
* **font:** replace hardcoded font sizes with CSS variables in schema/data comparison components ([5eba12d](https://github.com/sunpebble/quarry/commit/5eba12d2a5ea601ce376decb138a24a4d0d08e79))
* resolve all ESLint warnings and TypeScript errors ([0f06552](https://github.com/sunpebble/quarry/commit/0f06552fc0ac489b1789f963318ab2d97cbd8b32))
* security hardening, design migration cleanup, and code quality improvements ([62bef2a](https://github.com/sunpebble/quarry/commit/62bef2addb9635906008f22b264b5c096f934c6b))
* set Monaco dark theme when opening query editor for screenshots ([b1a6e60](https://github.com/sunpebble/quarry/commit/b1a6e6080dc43250ff9770573604989995c89269))
* **ui:** center welcome screen and website screenshots vertically ([43af900](https://github.com/sunpebble/quarry/commit/43af9001f75eebec35555f16343b9a47ff0647b7))
* website carousel layout and screenshot capture ([f994968](https://github.com/sunpebble/quarry/commit/f9949684a53f0c4e92d8cdae4b1290d762c781da))
* **website:** fix download button shadow overflow on landing page ([7b11780](https://github.com/sunpebble/quarry/commit/7b117804ddf888faeba2709ee5ae96123fc22e0d))


### Performance Improvements

* optimize bundle size with direct imports and code splitting ([0e941ca](https://github.com/sunpebble/quarry/commit/0e941cadaa6a7c2d14b6d17463151a3e48e7b9ac))
* virtualize DataTable rows with @tanstack/react-virtual ([a38fb95](https://github.com/sunpebble/quarry/commit/a38fb95fd19c7cedc99d8108060b9df660aaa34f))

## [1.1.0](https://github.com/sunpebble/quarry/compare/quarry-website-v1.0.0...quarry-website-v1.1.0) (2026-03-17)

### Features

- **02-01:** align website text tokens with Slate palette ([642d35a](https://github.com/sunpebble/quarry/commit/642d35aaebf644d29ac600c47b65a9099ccb16b5))
- **09-01:** add primitive palette and restructure semantic tokens ([afdd289](https://github.com/sunpebble/quarry/commit/afdd2895faf33517acaf497b72100d9a66e7f4be))
- **09-01:** add Tailwind v4 [@theme](https://github.com/theme) inline integration ([45ccb97](https://github.com/sunpebble/quarry/commit/45ccb9747c9c87eca261eebf9f01e2f7113a0366))
- **10-01:** remove Pricing section and simplify hero copy ([8755b3e](https://github.com/sunpebble/quarry/commit/8755b3e1a36290dd15dfeae619f0939a7c434730))
- **10-01:** simplify hero section to screenshot-first design ([718aafc](https://github.com/sunpebble/quarry/commit/718aafcf51f879b431cb608b0ffe5ee07fe45f2e))
- **10-02:** implement bento grid layout for Features section ([d92bad6](https://github.com/sunpebble/quarry/commit/d92bad6191514a5424563f6ee879ec795be57263))
- **10-03:** minimize Footer to essential links only ([bd1c0fc](https://github.com/sunpebble/quarry/commit/bd1c0fce4c39ebc7abfdb2acb2bbc88e4e0537dd))
- **10-03:** streamline Download section to single CTA ([78b0cac](https://github.com/sunpebble/quarry/commit/78b0cacb970f7a8a64092d825e57e25972528e4f))
- **11-01:** add Features header scroll animation ([9a93a13](https://github.com/sunpebble/quarry/commit/9a93a13a3e9be69c4192047a1c5e657d84373e0f))
- **11-01:** create useInView hook and convert Download to scroll-triggered ([66b8c1b](https://github.com/sunpebble/quarry/commit/66b8c1b93875b84bc2879444abb78652d63118a4))
- **agent:** convert AI chat from modal to sidebar layout ([9f62dd2](https://github.com/sunpebble/quarry/commit/9f62dd2fcb9f516472c1ab2b332d6d38c4f8d163))
- **design:** unify design language across Electron and website ([#67](https://github.com/sunpebble/quarry/issues/67)) ([b3fb22a](https://github.com/sunpebble/quarry/commit/b3fb22a7f927b6f2fa9e585604f255c32c582473))
- **i18n:** fix errors and add missing translations ([db6d5c3](https://github.com/sunpebble/quarry/commit/db6d5c3e67b4c54fe5fed1fae0cc9b31c2c90478))
- **i18n:** translate Keyboard Shortcuts dialog ([8e3d0fd](https://github.com/sunpebble/quarry/commit/8e3d0fda44b86303cf292b63812c087fc944542a))
- migrate auto-update to Cloudflare R2 and enhance UI components ([4fd1684](https://github.com/sunpebble/quarry/commit/4fd1684d2ddc5bc76ca78b9181620d814047d0bf))
- **payment:** refactor license dialog to wizard-style flow with new components ([#60](https://github.com/sunpebble/quarry/issues/60)) ([fc64ff8](https://github.com/sunpebble/quarry/commit/fc64ff80fec1b21b5017e95d1df83f14713de850))
- **ui:** apply neobrutalism design system to UI components ([fec3639](https://github.com/sunpebble/quarry/commit/fec363992097a11938bd51b12a01268ae4bffb49))
- **ui:** comprehensive UI polish and micro-interactions ([651f4f3](https://github.com/sunpebble/quarry/commit/651f4f320eef5ed13a242d0ae91d165407cafee7))
- **ui:** implement Data Sanctum design system across application ([51bf362](https://github.com/sunpebble/quarry/commit/51bf362dea75077edc8f94065f58747b96f81323))
- **website:** add official website with i18n and a11y ([f49fa75](https://github.com/sunpebble/quarry/commit/f49fa75149fbde7831f1b8db16ed08a99f90dfe0))
- **website:** add Pricing section with subscription plans ([6c9c5be](https://github.com/sunpebble/quarry/commit/6c9c5beb6a8170d78ef38ed712acc933ee56f834))
- **website:** add Remotion promo video and new landing page sections ([b46f81a](https://github.com/sunpebble/quarry/commit/b46f81ab46bfbc06c27ad1a65d9fc9a2819f41d5))
- **website:** connect pricing buttons to Stripe checkout ([3a0b856](https://github.com/sunpebble/quarry/commit/3a0b856b2a98864ba66042cf9e723d059bc7fd18))
- **website:** enhance SEO meta tags and improve marketing copy ([de4cafd](https://github.com/sunpebble/quarry/commit/de4cafde7828eb1cf9de57023aa758bb5e475d48))
- **website:** redesign with Fresh Modern design system ([#87](https://github.com/sunpebble/quarry/issues/87)) ([d92c178](https://github.com/sunpebble/quarry/commit/d92c17832338b7ad83be3a592c927377cf271e40))

### Bug Fixes

- **09-02:** migrate base styles to semantic tokens in index.css ([f535abc](https://github.com/sunpebble/quarry/commit/f535abc99a356ca36ce9bea92695bcdae15f5726))
- **11:** fix className template to properly add visible class ([b3fa4f3](https://github.com/sunpebble/quarry/commit/b3fa4f3b9659bb682a6394dc10a6749f1cc39070))
- ensure Monaco editor theme syncs before dark mode screenshot ([d494398](https://github.com/sunpebble/quarry/commit/d4943988d0a5febd7ca0262c3a29baccef909966))
- expose Monaco to window for screenshot theme synchronization ([bd2fc75](https://github.com/sunpebble/quarry/commit/bd2fc75b3e696b17a5f62a46f6b9ecffe961e518))
- **font:** replace hardcoded font sizes with CSS variables in schema/data comparison components ([5eba12d](https://github.com/sunpebble/quarry/commit/5eba12d2a5ea601ce376decb138a24a4d0d08e79))
- resolve all ESLint warnings and TypeScript errors ([0f06552](https://github.com/sunpebble/quarry/commit/0f06552fc0ac489b1789f963318ab2d97cbd8b32))
- security hardening, design migration cleanup, and code quality improvements ([62bef2a](https://github.com/sunpebble/quarry/commit/62bef2addb9635906008f22b264b5c096f934c6b))
- set Monaco dark theme when opening query editor for screenshots ([b1a6e60](https://github.com/sunpebble/quarry/commit/b1a6e6080dc43250ff9770573604989995c89269))
- **ui:** center welcome screen and website screenshots vertically ([43af900](https://github.com/sunpebble/quarry/commit/43af9001f75eebec35555f16343b9a47ff0647b7))
- website carousel layout and screenshot capture ([f994968](https://github.com/sunpebble/quarry/commit/f9949684a53f0c4e92d8cdae4b1290d762c781da))
- **website:** fix download button shadow overflow on landing page ([7b11780](https://github.com/sunpebble/quarry/commit/7b117804ddf888faeba2709ee5ae96123fc22e0d))

### Performance Improvements

- optimize bundle size with direct imports and code splitting ([0e941ca](https://github.com/sunpebble/quarry/commit/0e941cadaa6a7c2d14b6d17463151a3e48e7b9ac))
- virtualize DataTable rows with @tanstack/react-virtual ([a38fb95](https://github.com/sunpebble/quarry/commit/a38fb95fd19c7cedc99d8108060b9df660aaa34f))
