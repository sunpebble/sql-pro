# Changelog

## [2.0.0](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.17.0...quarry-monorepo-v2.0.0) (2026-07-05)


### ⚠ BREAKING CHANGES

* the Electron desktop app and web demo are no longer built from this repository; Windows/Linux builds are discontinued.

### Features

* **swiftui:** close electron feature gaps, drop AI and plugins ([a77eb92](https://github.com/sunpebble/quarry/commit/a77eb92c5f5884aa281851a909fb8c30302292e5))


### Bug Fixes

* **license-api:** read current_period_end from subscription items ([a7f45ce](https://github.com/sunpebble/quarry/commit/a7f45ce472e42ee37e4d7fc3c8ad0c875938a99e))


### Code Refactoring

* retire the electron app in favor of the native macOS app ([43aa2e6](https://github.com/sunpebble/quarry/commit/43aa2e6ff495e2d64a17e157f2a79ca70a34cceb))

## [1.17.0](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.11...quarry-monorepo-v1.17.0) (2026-07-05)


### Features

* **swiftui:** native SwiftUI app ([#244](https://github.com/sunpebble/quarry/issues/244)) ([ae01495](https://github.com/sunpebble/quarry/commit/ae0149581ece4861f49f5c8dea3942136a7e76dc))

## [1.16.11](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.10...quarry-monorepo-v1.16.11) (2026-07-05)


### Bug Fixes

* **electron:** create dmg for x64 mac output ([6ca489c](https://github.com/sunpebble/quarry/commit/6ca489c2f5a2bcca4688c819a922ecac93e69509))

## [1.16.10](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.9...quarry-monorepo-v1.16.10) (2026-07-05)


### Bug Fixes

* **electron:** notarize compressed mac dmg ([ff371f8](https://github.com/sunpebble/quarry/commit/ff371f84fb0e8f994c1aaf8abca66e1eb20b0573))

## [1.16.9](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.8...quarry-monorepo-v1.16.9) (2026-07-05)


### Bug Fixes

* **ci:** import mac signing cert into unlocked keychain ([f11acb0](https://github.com/sunpebble/quarry/commit/f11acb044a806fcd8bb94eec71a0a420ce7d63e9))
* **electron:** log mac signing completion ([176abea](https://github.com/sunpebble/quarry/commit/176abea33231aea3d8d02ba72f832fb0a3bc1be7))

## [1.16.8](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.7...quarry-monorepo-v1.16.8) (2026-07-05)


### Bug Fixes

* **electron:** dedupe mac framework signing paths ([be15ca5](https://github.com/sunpebble/quarry/commit/be15ca5227e4d53956cfa5a8ef7b7b01fbe7ad75))

## [1.16.7](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.6...quarry-monorepo-v1.16.7) (2026-07-05)


### Bug Fixes

* **electron:** skip signing mac resource blobs ([dfd7b3f](https://github.com/sunpebble/quarry/commit/dfd7b3fa5da944c0c631beb3a1cb910835f49f0a))

## [1.16.6](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.5...quarry-monorepo-v1.16.6) (2026-07-05)


### Bug Fixes

* **electron:** use team id for mac signing identity ([d254433](https://github.com/sunpebble/quarry/commit/d25443319250a13fd89f6abc71c53f923afc7525))

## [1.16.5](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.4...quarry-monorepo-v1.16.5) (2026-07-05)


### Bug Fixes

* **electron:** pin mac signing identity to release team ([d5b3f63](https://github.com/sunpebble/quarry/commit/d5b3f63f0b3a3da1302cd60cc2e6fe59f58eb5d0))
* **electron:** require Developer ID for mac CI signing ([18496b6](https://github.com/sunpebble/quarry/commit/18496b6a21e9485f9df1a1f99d76c17f3fbb0279))
* resolve dependency security advisories ([b267adc](https://github.com/sunpebble/quarry/commit/b267adc5b9e0f426f453023de5418dc636de9434))
* satisfy lint after dependency update ([f27498e](https://github.com/sunpebble/quarry/commit/f27498e6d1fe1d8cd2e7dd7a95990d8e0464a8b2))

## [1.16.4](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.3...quarry-monorepo-v1.16.4) (2026-07-05)


### Bug Fixes

* **electron:** sign mac builds with resolved identity hash ([bf84432](https://github.com/sunpebble/quarry/commit/bf84432ee9495018aced4f082116c9609ce502fd))

## [1.16.3](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.2...quarry-monorepo-v1.16.3) (2026-07-05)


### Bug Fixes

* **electron:** exclude pnpm bin shims from app package ([64f8da1](https://github.com/sunpebble/quarry/commit/64f8da1d015c0f6070cfa5684baf0baea4259f8a))

## [1.16.2](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.1...quarry-monorepo-v1.16.2) (2026-07-05)


### Bug Fixes

* **electron:** make release packaging avoid pnpm collector ([fe67e2d](https://github.com/sunpebble/quarry/commit/fe67e2dc79959e87abecee56585cf1197b6ef39c))

## [1.16.1](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.16.0...quarry-monorepo-v1.16.1) (2026-07-05)


### Bug Fixes

* **electron:** hardcode updater version for packaging ([3a7955d](https://github.com/sunpebble/quarry/commit/3a7955d25e561f2fe56dbafce92a4892718c742d))

## [1.16.0](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.15.1...quarry-monorepo-v1.16.0) (2026-07-05)


### Features

* **01-01:** invert CSS to dark-first architecture with orange primary ([e8bee02](https://github.com/sunpebble/quarry/commit/e8bee0257987b55c4db139d9628e3d9ce7d86ac9))
* **02-01:** add text hierarchy tokens to shared UI package ([bb38f6a](https://github.com/sunpebble/quarry/commit/bb38f6a85d1c99d4cd8ca972351abc3e522749ec))
* **02-01:** align website text tokens with Slate palette ([642d35a](https://github.com/sunpebble/quarry/commit/642d35aaebf644d29ac600c47b65a9099ccb16b5))
* **02-01:** update globals.css text hierarchy tokens ([296250a](https://github.com/sunpebble/quarry/commit/296250a9818aeb56e7561ded618aef23955bc1b0))
* **05-02:** add height animation and polish to command components ([fc5a390](https://github.com/sunpebble/quarry/commit/fc5a390f2ff62f94a7d548e24d8c7df8e4d6b9ef))
* **05-02:** polish CommandPalette component styling ([1b4facb](https://github.com/sunpebble/quarry/commit/1b4facb8c7f4c8566b6d09f22c70178b27c26dff))
* **05-03:** add inline keyboard shortcuts to Titlebar ([b1ea3f7](https://github.com/sunpebble/quarry/commit/b1ea3f7bf14e4383d06548106e9918031c8a0812))
* **05-03:** add inline shortcuts to remaining menus ([0c2fb94](https://github.com/sunpebble/quarry/commit/0c2fb94763d90c8b2f9207bfed6b135544142f47))
* **05-04:** wire up view context and add view-specific command filtering ([3d709b1](https://github.com/sunpebble/quarry/commit/3d709b134f1c61a97e118254c3a3a2be1e2f8721))
* **06-02:** add glassmorphism to ContextMenuContent ([86bde93](https://github.com/sunpebble/quarry/commit/86bde93c38c9a02d58f5df69a184ddc3500a6eab))
* **06-02:** add glassmorphism to PopoverContent and DropdownMenuContent ([8835d73](https://github.com/sunpebble/quarry/commit/8835d73d5e1b117083017fa048468a9476d6e73c))
* **06-02:** add glassmorphism to TooltipContent and HoverCardContent ([4c910c6](https://github.com/sunpebble/quarry/commit/4c910c6a0a02b964890783b11163c1e5ea9e7e26))
* **07-01:** add group-hover to pinned cells and selection column ([9115e47](https://github.com/sunpebble/quarry/commit/9115e470c196de07a6cd5fee31f9912aed0886d4))
* **07-01:** add row hover states to DataRow ([eda8373](https://github.com/sunpebble/quarry/commit/eda8373536c16968bb0b719dc78514d3515390f0))
* **08-01:** coordinate Monaco themes with design system ([3162992](https://github.com/sunpebble/quarry/commit/31629928e377635070442e84c80bae0c760185f9))
* **09-01:** add primitive palette and restructure semantic tokens ([afdd289](https://github.com/sunpebble/quarry/commit/afdd2895faf33517acaf497b72100d9a66e7f4be))
* **09-01:** add Tailwind v4 [@theme](https://github.com/theme) inline integration ([45ccb97](https://github.com/sunpebble/quarry/commit/45ccb9747c9c87eca261eebf9f01e2f7113a0366))
* **10-01:** remove Pricing section and simplify hero copy ([8755b3e](https://github.com/sunpebble/quarry/commit/8755b3e1a36290dd15dfeae619f0939a7c434730))
* **10-01:** simplify hero section to screenshot-first design ([718aafc](https://github.com/sunpebble/quarry/commit/718aafcf51f879b431cb608b0ffe5ee07fe45f2e))
* **10-02:** implement bento grid layout for Features section ([d92bad6](https://github.com/sunpebble/quarry/commit/d92bad6191514a5424563f6ee879ec795be57263))
* **10-03:** minimize Footer to essential links only ([bd1c0fc](https://github.com/sunpebble/quarry/commit/bd1c0fce4c39ebc7abfdb2acb2bbc88e4e0537dd))
* **10-03:** streamline Download section to single CTA ([78b0cac](https://github.com/sunpebble/quarry/commit/78b0cacb970f7a8a64092d825e57e25972528e4f))
* **11-01:** add Features header scroll animation ([9a93a13](https://github.com/sunpebble/quarry/commit/9a93a13a3e9be69c4192047a1c5e657d84373e0f))
* **11-01:** create useInView hook and convert Download to scroll-triggered ([66b8c1b](https://github.com/sunpebble/quarry/commit/66b8c1b93875b84bc2879444abb78652d63118a4))
* **12-01:** add tableOrganization to RendererStoreSchema ([a3a505e](https://github.com/sunpebble/quarry/commit/a3a505e338d85d02c3ff29f35178716893f9ce01))
* **12-01:** create TagDefinition type with color support ([8b666b4](https://github.com/sunpebble/quarry/commit/8b666b43719fed7d327416d445df50cabf7f0ed9))
* **12-01:** upgrade table-organization-store to use TagDefinition ([9a71746](https://github.com/sunpebble/quarry/commit/9a71746cf99df165872617f201b7c0627f735487))
* **12-02:** add ColoredTagBadge component ([8a35b24](https://github.com/sunpebble/quarry/commit/8a35b2418cc1c43638b57872f59f9ad00ea65387))
* **12-02:** add CreateTagDialog and EditTagDialog components ([abd6155](https://github.com/sunpebble/quarry/commit/abd61554d0e8c9a1f32d8552876180cf08244e74))
* **12-03:** add persistence to table-organization-store ([b694cff](https://github.com/sunpebble/quarry/commit/b694cff54b94e584360ab48aaa8c92c9b9d7f74f))
* **12-03:** add useTagCommands hook for command palette integration ([67a33e2](https://github.com/sunpebble/quarry/commit/67a33e2ee6d7d84c6a4d6d5f25539276b8135ba7))
* **12-03:** update Sidebar to use colored tags and new dialogs ([ec20688](https://github.com/sunpebble/quarry/commit/ec20688245f8efda930f68839a1643ac4816a47c))
* **13-01:** create saved query types ([b2b8c37](https://github.com/sunpebble/quarry/commit/b2b8c378044c69a11358b4fac72451eaedc621da))
* **13-01:** create saved-queries-store with persistence ([2d11945](https://github.com/sunpebble/quarry/commit/2d119455d36b870242f82364321618aeadb86fcc))
* **13-01:** update renderer-store schema for saved queries ([19dba6a](https://github.com/sunpebble/quarry/commit/19dba6ae1df76d08e1f89c97560127bb0b37a46c))
* **13-02:** add ParameterInputDialog component ([334a537](https://github.com/sunpebble/quarry/commit/334a537d214a7615d7f77088d375770e76444074))
* **13-02:** add SavedQueriesBrowser with folder sidebar and QueryCard ([b43be35](https://github.com/sunpebble/quarry/commit/b43be35704ae4184494959583c4bca401d07c224))
* **13-02:** add SaveQueryDialog and EditQueryDialog components ([8f85cf4](https://github.com/sunpebble/quarry/commit/8f85cf454eb24bae81695ca966835b53e2eecca6))
* **13-03:** create useSavedQueryCommands hook for command palette integration ([984242e](https://github.com/sunpebble/quarry/commit/984242e80c1402b48b65fe76c3a4b78f6b7f38b6))
* **13-03:** initialize saved queries store and add i18n ([ea5875d](https://github.com/sunpebble/quarry/commit/ea5875df773c4e66ddcda862d95b2fec6c4fef70))
* **13-03:** integrate saved queries into QueryEditor toolbar ([fa0af3e](https://github.com/sunpebble/quarry/commit/fa0af3ece9f036ee8be10d1baef40d72e0f294e2))
* **14-01:** create SSH credential store service ([85005fc](https://github.com/sunpebble/quarry/commit/85005fc3de21b0658170d71a25018e0504490b1b))
* **14-01:** create SSHTunnel and TunnelManager ([d96e673](https://github.com/sunpebble/quarry/commit/d96e6738890af403706b2d236d79011455fcab94))
* **14-01:** install ssh2 and create SSH types ([18d9d81](https://github.com/sunpebble/quarry/commit/18d9d810ca799766f4704fdab75c6fd1bcef7f35))
* **14-02:** add i18n translations for SSH tunnel UI ([78bf6bc](https://github.com/sunpebble/quarry/commit/78bf6bcf13a3a76fe49d531f5a3b7183d5eafb47))
* **14-02:** create SSHTunnelConfig component ([36bb36f](https://github.com/sunpebble/quarry/commit/36bb36fd3e3b2d3205f3387675863dfea70b8c82))
* **14-02:** integrate SSHTunnelConfig into ServerConnectionDialog ([a27d759](https://github.com/sunpebble/quarry/commit/a27d75918e44a241ca4153f2af4a90d96118241b))
* **14-03:** add SSH IPC handlers and preload bridge ([12ba813](https://github.com/sunpebble/quarry/commit/12ba813b6fdafeb1621dd878f4a25e4bb6c11b33))
* **14-03:** add tunnel status indicator and connection store updates ([1f7bb79](https://github.com/sunpebble/quarry/commit/1f7bb7951974c90c56dcc2ac343baa400c13aaf4))
* **14-03:** integrate SSH tunnel creation into database connection flow ([2e3d9e9](https://github.com/sunpebble/quarry/commit/2e3d9e9ddc73558f81ff873245ce018b022006af))
* **15:** add AI natural language query feature ([e2a51d9](https://github.com/sunpebble/quarry/commit/e2a51d9ad9532aba3971712d35c9c3f2414a648a))
* **a11y:** add ARIA labels to icon-only buttons in Titlebar and Toolbar ([#135](https://github.com/sunpebble/quarry/issues/135)) ([75b4e98](https://github.com/sunpebble/quarry/commit/75b4e98fcffa123d067e7e66cdbcd8b311c0bda9))
* add 'All' option to pagination for viewing all rows without limit ([d2fb28b](https://github.com/sunpebble/quarry/commit/d2fb28b677e7566f65de4ad6060e354a4be36131))
* add advanced database tools suite ([ef3696a](https://github.com/sunpebble/quarry/commit/ef3696ae8fb0fbd56929149364d55fbd6d5b225f))
* add application logging system for main process ([814e04c](https://github.com/sunpebble/quarry/commit/814e04c839c27d934425a288a17b8f35ab21e5af))
* add aria labels to TableView buttons ([#151](https://github.com/sunpebble/quarry/issues/151)) ([d7e8acb](https://github.com/sunpebble/quarry/commit/d7e8acb5fd8fc1802b2de30a9ceb7284def34e00))
* Add aria-label to icon-only buttons in AI Agent components ([#148](https://github.com/sunpebble/quarry/issues/148)) ([0f72f42](https://github.com/sunpebble/quarry/commit/0f72f42f0260a8536440a78f22aa6e29c59ef783))
* add async column distribution for Qdrant and refine UI components ([d004598](https://github.com/sunpebble/quarry/commit/d004598a1003195ad1e5cf5721ec4c338f81fd61))
* add folder tree path encoder for pierre trees ([d651322](https://github.com/sunpebble/quarry/commit/d651322b149bc3a9b6cda84df442cbb8b367272f))
* add pierre diffs theme mapping util ([18d2a66](https://github.com/sunpebble/quarry/commit/18d2a668cfcce7b9e4bffcce9b56e07a48882c9c))
* add pierre trees FolderTreeView spike (coexists with FolderTree) ([f761947](https://github.com/sunpebble/quarry/commit/f761947f96dfea76c75f3fea9df03ae8feaff6b1))
* add schema SQL unified patch builder ([324ba3b](https://github.com/sunpebble/quarry/commit/324ba3bda25fa597a5fb006eeedcad42c3775895))
* add show/hide password toggle to PasswordDialog ([#140](https://github.com/sunpebble/quarry/issues/140)) ([7332294](https://github.com/sunpebble/quarry/commit/7332294d1d29a71102c0ac299dc76fd3d663973a))
* add SQL diff view toggle to schema comparison ([e97ac7c](https://github.com/sunpebble/quarry/commit/e97ac7c5243cd836fb584eec2d35382de820891f))
* add SqlDiffView wrapping pierre PatchDiff ([e71ec01](https://github.com/sunpebble/quarry/commit/e71ec0136ce2f55af2370cd97c92441d46e20bf6))
* add Turso edge database support ([0f5449e](https://github.com/sunpebble/quarry/commit/0f5449e3cdc45744c94b1110e2afff90298236a3))
* add viewMode state to schema comparison store ([94a82ac](https://github.com/sunpebble/quarry/commit/94a82ac74dafa636e861b7bcb4252bb8095d8a3c))
* **agent:** add Vercel AI SDK dependencies and type definitions ([d8b1783](https://github.com/sunpebble/quarry/commit/d8b17834906e306e1fec1c4ab5c18b20e56bcd13))
* **agent:** convert AI chat from modal to sidebar layout ([9f62dd2](https://github.com/sunpebble/quarry/commit/9f62dd2fcb9f516472c1ab2b332d6d38c4f8d163))
* **agent:** implement AI Agent UI components (Phase 3) ([126c94b](https://github.com/sunpebble/quarry/commit/126c94bd44b38424f29bce4c3caf06a2c41fab22))
* **agent:** implement main process AI agent with Vercel AI SDK ([b0564b6](https://github.com/sunpebble/quarry/commit/b0564b66ed4fcd789b3d4e6d056823441fe94cf6))
* align app chrome with Linear style ([5ff598a](https://github.com/sunpebble/quarry/commit/5ff598affaca991a35cbd74deac4bf039ace8829))
* align database support with DB Pro ([22e4485](https://github.com/sunpebble/quarry/commit/22e4485b99e88f8d0c29028f3ae375b863324af7))
* **dashboard:** optimize database dashboard with parallel queries, insights, and polished UI ([c7d483f](https://github.com/sunpebble/quarry/commit/c7d483f8fee0651dc705ba6332c7284cfc742f71))
* **data-table:** add row animations and optimize column resize performance ([3e7816f](https://github.com/sunpebble/quarry/commit/3e7816f6639f3850a912eb752326eedacd87b12f))
* **database-manager:** register TursoAdapter ([a627072](https://github.com/sunpebble/quarry/commit/a627072b0068510c85d62657a5ae5acb8a0edc44))
* **database:** add getColumnDistribution method for full table aggregation ([5f3a93f](https://github.com/sunpebble/quarry/commit/5f3a93f467630db1b3844dc553fe21046796c5cf))
* **design:** unify design language across Electron and website ([#67](https://github.com/sunpebble/quarry/issues/67)) ([b3fb22a](https://github.com/sunpebble/quarry/commit/b3fb22a7f927b6f2fa9e585604f255c32c582473))
* **electron:** add screenshot capture script for marketing materials ([f064f0c](https://github.com/sunpebble/quarry/commit/f064f0cb6b88119ed3c2873f9c20dc0f55403c5f))
* explore Electron to standalone Web App feasibility with PoC ([#172](https://github.com/sunpebble/quarry/issues/172)) ([e319509](https://github.com/sunpebble/quarry/commit/e319509b8525ab4e83f4e3545f447d5daa06f937))
* **i18n:** add Chinese translations for connection and tab menus ([21ff6ff](https://github.com/sunpebble/quarry/commit/21ff6ff62dc4a9058d4ca7c025b32fe0f96f5061))
* **i18n:** add Chinese translations for Pro license and filter dialogs ([c683dd7](https://github.com/sunpebble/quarry/commit/c683dd779e346ad8c8b0615233d7a2732b98f728))
* **i18n:** add Chinese translations for welcome dialog and tour ([0ce25e5](https://github.com/sunpebble/quarry/commit/0ce25e5c5a73178ff756be999c765029974d791c))
* **i18n:** add contextMenu, diagram, sidebar, quit translation keys ([789ff2b](https://github.com/sunpebble/quarry/commit/789ff2b4ac04acc2629bbccf2fd6af7c8ef402cb))
* **i18n:** add English translations for keyboard shortcut actions ([4298195](https://github.com/sunpebble/quarry/commit/42981954a24f8c39b4f05d0d61a8f7d0f957960f))
* **i18n:** add missing query builder translations ([28b60bb](https://github.com/sunpebble/quarry/commit/28b60bb6fa68ba48c00225b42679f9cad24cacbf))
* **i18n:** add missing translation keys and complete i18n coverage ([c876ca3](https://github.com/sunpebble/quarry/commit/c876ca36af07620243449459165539abdadacc54))
* **i18n:** add translation for Custom provider option ([380c188](https://github.com/sunpebble/quarry/commit/380c188b4d5ab939049ff44378e5588a1c332e20))
* **i18n:** add translations for FolderTree and ProfileForm components ([0d3ee63](https://github.com/sunpebble/quarry/commit/0d3ee63ca1c3e3552b05d683aff1d7a8a69b98b8))
* **i18n:** add translations for ProfileManager and DiffPreview components ([4573674](https://github.com/sunpebble/quarry/commit/45736741752045d2b2e265d2444c4a788145b31f))
* **i18n:** add translations for SelectionStats and keyboard shortcuts ([e9e4cc8](https://github.com/sunpebble/quarry/commit/e9e4cc821050c2bd2839ba59e8d1176a68294033))
* **i18n:** complete i18n translations for hardcoded strings ([ade9cc4](https://github.com/sunpebble/quarry/commit/ade9cc4a2809422b55ee062d090d7dc704de45c5))
* **i18n:** finalize i18n implementation across all components ([0c3fcbd](https://github.com/sunpebble/quarry/commit/0c3fcbd1703c9b6620f6f6f903ceb48053dd1827))
* **image-gallery:** add image gallery feature for viewing images in database ([76a1791](https://github.com/sunpebble/quarry/commit/76a17919867425e9bd9e18432567b3b88596c342))
* **image-gallery:** add sqlpro:// protocol with caching and HEAD preflight check ([3755c31](https://github.com/sunpebble/quarry/commit/3755c31c32eebe26b5fe1186bca2889d74d272f4))
* improve UX for data table and media gallery ([01f5435](https://github.com/sunpebble/quarry/commit/01f5435c9c9c751772d5c9a452c379197fd369f0))
* **license-api:** add email notification for license key delivery ([4e3d34f](https://github.com/sunpebble/quarry/commit/4e3d34f2e6697fac7b22902e7fcb5dea4d7963d8))
* **media-gallery:** add video streaming support and locate-in-table feature ([c09ee63](https://github.com/sunpebble/quarry/commit/c09ee63753e7515ed0ecb971e65494dd4f00a91b))
* **media-gallery:** add video support with ffprobe detection and Range requests ([cf122f8](https://github.com/sunpebble/quarry/commit/cf122f83469b5bc7b66d9a4b04bea9f8b41033b8))
* **media-preview:** add comprehensive metadata display ([99ef49e](https://github.com/sunpebble/quarry/commit/99ef49e22c02b65e024bfaac3bc34ade0abf6bab))
* **media-preview:** add file path display with copy and reveal actions ([e0cf1b5](https://github.com/sunpebble/quarry/commit/e0cf1b55cd2260ffcb5f76e77ad3db5f69559d37))
* **media-preview:** enhance viewer with video metadata and zoom/pan controls ([c252506](https://github.com/sunpebble/quarry/commit/c252506a93ef2b04a0ba0685d13e3229a9fb7d00))
* migrate auto-update to Cloudflare R2 and enhance UI components ([4fd1684](https://github.com/sunpebble/quarry/commit/4fd1684d2ddc5bc76ca78b9181620d814047d0bf))
* migrate sql-pro to sunpebble branding ([887e371](https://github.com/sunpebble/quarry/commit/887e3716a34d8c3b4260f2a6d50f01d3158c06d7))
* **payment:** refactor license dialog to wizard-style flow with new components ([#60](https://github.com/sunpebble/quarry/issues/60)) ([fc64ff8](https://github.com/sunpebble/quarry/commit/fc64ff80fec1b21b5017e95d1df83f14713de850))
* **perf:** wrap sqlite changes in transaction ([#102](https://github.com/sunpebble/quarry/issues/102)) ([5110204](https://github.com/sunpebble/quarry/commit/51102046376f9eccf4a2646d2a8fe453824f48ae))
* **qdrant:** add Qdrant vector database support (Phase 1 MVP) ([#74](https://github.com/sunpebble/quarry/issues/74)) ([59b22b8](https://github.com/sunpebble/quarry/commit/59b22b8237b9e1c2b932d79c0068e036fe8af626))
* **qdrant:** add vector search functionality (Phase 2) ([#75](https://github.com/sunpebble/quarry/issues/75)) ([4e0902a](https://github.com/sunpebble/quarry/commit/4e0902a3aa6d60f312360779e2d5e9ec2317adf1))
* **qdrant:** complete vector search integration with UI improvements ([570afbd](https://github.com/sunpebble/quarry/commit/570afbd949f81eb5376f74d16d737884399ac3bb))
* **query-builder:** add DBeaver-style interactions and visual enhancements ([b295a5d](https://github.com/sunpebble/quarry/commit/b295a5dec518d473e89d52b6ed515297fd3a5b85))
* **query:** merge SQL Editor and Query Builder into unified Query View ([5d1a412](https://github.com/sunpebble/quarry/commit/5d1a4126913544544b074c722ebc953904c3824b))
* remove /debug/callback endpoint ([#99](https://github.com/sunpebble/quarry/issues/99)) ([b741d63](https://github.com/sunpebble/quarry/commit/b741d638a699514e279c8af9055aa2954701076f))
* replace FolderTree with pierre trees FileTree ([74c8cf8](https://github.com/sunpebble/quarry/commit/74c8cf8b125b1b9476fc47b45d3f097de8bd3fe8))
* **shortcuts:** add focus toggle between sidebar and data table ([fbe3696](https://github.com/sunpebble/quarry/commit/fbe3696d9e6c2438d1d400c9ee0c52652a1abe53))
* **shortcuts:** add SQL log toggle shortcut and update AI Agent shortcut ([150a0b5](https://github.com/sunpebble/quarry/commit/150a0b5f350a97025b5dd8040eaaa7505aee62ae))
* **skeleton-loading:** add skeleton loading states across components ([#68](https://github.com/sunpebble/quarry/issues/68)) ([50e128d](https://github.com/sunpebble/quarry/commit/50e128d284764ae80e485ac2ec9cce006cabce35))
* **table:** add image gallery view for visualizing image data ([a2b310b](https://github.com/sunpebble/quarry/commit/a2b310bfba921483a0dd4f968ff031e58b2127c0))
* **turso:** implement TursoAdapter with libsql client ([2dc94e1](https://github.com/sunpebble/quarry/commit/2dc94e141edc76a8ed95411031e76ddf0aca2402))
* **turso:** implement TursoPlatformService for API integration ([f68bdb2](https://github.com/sunpebble/quarry/commit/f68bdb2477ea0e7176163b106d5076d4c798814e))
* **types:** add Turso database type and connection config fields ([c01770b](https://github.com/sunpebble/quarry/commit/c01770b98a2304d9a0e5ce18df1a38bd3ba8a4a1))
* **ui:** add brand color, enhance interactions, and add view shortcuts ([eca2f4e](https://github.com/sunpebble/quarry/commit/eca2f4e3144fd4e0fd3374dcadc915cb40d52fa1))
* **ui:** add Turso database connection support ([bc10a91](https://github.com/sunpebble/quarry/commit/bc10a91e99397a7bd8a42848acb6aacdc56704dc))
* **ui:** apply neobrutalism design system to UI components ([fec3639](https://github.com/sunpebble/quarry/commit/fec363992097a11938bd51b12a01268ae4bffb49))
* **ui:** comprehensive UI polish and micro-interactions ([651f4f3](https://github.com/sunpebble/quarry/commit/651f4f320eef5ed13a242d0ae91d165407cafee7))
* **ui:** implement Data Sanctum design system across application ([51bf362](https://github.com/sunpebble/quarry/commit/51bf362dea75077edc8f94065f58747b96f81323))
* **ui:** redesign ER diagram controls and optimize pagination layout ([821c707](https://github.com/sunpebble/quarry/commit/821c70743a0f9bff0a9c7038517ef8b46d679f67))
* update ([5348925](https://github.com/sunpebble/quarry/commit/5348925bd541b71638f2b5da3b78e88e2091c7f0))
* **ux:** improve accessibility of SchemaDetailsPanel close button and sections ([#143](https://github.com/sunpebble/quarry/issues/143)) ([1a4a619](https://github.com/sunpebble/quarry/commit/1a4a61976c259fc5b504cffd423160fa7a9a87e2))
* **vector-search:** add 3D rotation and zoom interaction ([98323e5](https://github.com/sunpebble/quarry/commit/98323e5c009087e704af7f662fe42fe549f3ee6b))
* **vector-search:** add hover tooltip and enlarge effect for visualization ([658c41b](https://github.com/sunpebble/quarry/commit/658c41b2650330403c8fb47ae75c945309277d8e))
* **vim:** add Ctrl+D and Ctrl+U for half-page navigation ([2d17a98](https://github.com/sunpebble/quarry/commit/2d17a9810d57236ccc9b90ddc68774a84fc5dd41))
* **website:** add Pricing section with subscription plans ([6c9c5be](https://github.com/sunpebble/quarry/commit/6c9c5beb6a8170d78ef38ed712acc933ee56f834))
* **website:** add Remotion promo video and new landing page sections ([b46f81a](https://github.com/sunpebble/quarry/commit/b46f81ab46bfbc06c27ad1a65d9fc9a2819f41d5))
* **website:** connect pricing buttons to Stripe checkout ([3a0b856](https://github.com/sunpebble/quarry/commit/3a0b856b2a98864ba66042cf9e723d059bc7fd18))
* **website:** enhance SEO meta tags and improve marketing copy ([de4cafd](https://github.com/sunpebble/quarry/commit/de4cafde7828eb1cf9de57023aa758bb5e475d48))
* **website:** redesign with Fresh Modern design system ([#87](https://github.com/sunpebble/quarry/issues/87)) ([d92c178](https://github.com/sunpebble/quarry/commit/d92c17832338b7ad83be3a592c927377cf271e40))


### Bug Fixes

* **01:** cap floating-dock border-radius at 12px ([6c4b1cb](https://github.com/sunpebble/quarry/commit/6c4b1cb9694ae57feb045519fa83e62084bf904c))
* **06-03:** remove scale and shadow hover from Card ([a6b5b42](https://github.com/sunpebble/quarry/commit/a6b5b4260c497b107aae92b65f1da0f9d3211ba0))
* **09-02:** migrate base styles to semantic tokens in index.css ([f535abc](https://github.com/sunpebble/quarry/commit/f535abc99a356ca36ce9bea92695bcdae15f5726))
* **11:** fix className template to properly add visible class ([b3fa4f3](https://github.com/sunpebble/quarry/commit/b3fa4f3b9659bb682a6394dc10a6749f1cc39070))
* add key to DataTable to force remount on table switch, fixing virtualizer state ([689177c](https://github.com/sunpebble/quarry/commit/689177cde7fa37701a13694c68cb039e859b7e3b))
* add sqlpro protocol to CSP media-src for video playback ([3200b2c](https://github.com/sunpebble/quarry/commit/3200b2c3ac99cddb9fa65d10347cb996f3b474f5))
* **agent:** correct user avatar position in chat messages ([22cf971](https://github.com/sunpebble/quarry/commit/22cf9711fda93303642a3727e7b49e6a76bea6b3))
* **agent:** improve AI response language and reasoning display ([99f5e50](https://github.com/sunpebble/quarry/commit/99f5e508233a5a3e042175504d5d2b5073c83a6a))
* **agent:** use lazy state initialization for session ID ([cd65e13](https://github.com/sunpebble/quarry/commit/cd65e13131beda345921b1aa9dd0147f7218a4a6))
* **backup:** 修复 restoreBackup 流式解析缺少索引更新的 bug ([ac2f7c1](https://github.com/sunpebble/quarry/commit/ac2f7c127abc11296bb5b3b706b1cb62454d5723))
* build verification fixes for Ink & Paper design migration ([b6bbea0](https://github.com/sunpebble/quarry/commit/b6bbea0ed1c20192b0e265745d7095c88be13760))
* **chart:** prevent pie chart from being clipped in Data Type Distribution ([394b7e6](https://github.com/sunpebble/quarry/commit/394b7e62fbe58f382182684f3ae5b922780abf29))
* **ci:** allow builds for all ffmpeg/ffprobe installer platforms ([549d80c](https://github.com/sunpebble/quarry/commit/549d80c22121083efcc3ffb435a1b7fb6ac882e1))
* **ci:** repair lint failures from eslint config migration ([e0bb74f](https://github.com/sunpebble/quarry/commit/e0bb74f21bbe76cd1dcd3e5391f88548bb60aead))
* **ci:** resolve build and test failures from IpcHandler migration ([b49d25b](https://github.com/sunpebble/quarry/commit/b49d25b885a23113b214526213a82f8edba2283a))
* **connection-dialog:** prevent UI interaction gap during connection ([59cd695](https://github.com/sunpebble/quarry/commit/59cd6958261cd2a202c95cc862e75a4848f45a16))
* **connections:** disable connection actions while loading ([fc229fd](https://github.com/sunpebble/quarry/commit/fc229fdfec191ef6bef1f69316830797111794bf))
* **dashboard:** add spacing between tabs and content, fix data type grid layout ([4b5103f](https://github.com/sunpebble/quarry/commit/4b5103fc425e58a1138fdde9ab78f7279c4925d5))
* **dashboard:** enable scrolling by replacing overflow-hidden with min-h-0 ([81f67c3](https://github.com/sunpebble/quarry/commit/81f67c35a472f04ad021911a88f513cbac077ee7))
* **dashboard:** implement proper ScrollArea pattern with min-h-0 wrapper for all tabs ([8141f02](https://github.com/sunpebble/quarry/commit/8141f027cb26583e4b577e863a57592460353b76))
* **dashboard:** prevent content overflow with overflow-hidden on DialogContent ([df08e07](https://github.com/sunpebble/quarry/commit/df08e07063eb55680fee00a8230abc041a7afb0d))
* **dashboard:** prevent text wrapping in stat cards with whitespace-nowrap ([3fa40d1](https://github.com/sunpebble/quarry/commit/3fa40d13b3aa458d5ab19a501893d5710cd83927))
* **dashboard:** replace ScrollArea with native overflow-auto for proper scrolling ([a228c75](https://github.com/sunpebble/quarry/commit/a228c7562f83e175f293ce2f2876f5cb20ba1135))
* **dashboard:** resolve database dashboard query and chart display issues ([216b6f7](https://github.com/sunpebble/quarry/commit/216b6f75fa19a7bd74eb8511e90759439f932ca7))
* **dashboard:** restore vertical stat card layout to prevent truncation ([ce2c245](https://github.com/sunpebble/quarry/commit/ce2c245bf96300d3ae48f368d08ee0263162f4fd))
* **dashboard:** simplify ScrollArea structure with min-h-0 on TabsContent ([9044518](https://github.com/sunpebble/quarry/commit/9044518af0d80bbd744333e724924a72901ae4b4))
* **data-table:** add horizontal auto-scroll when navigating cells with keyboard ([a5930d1](https://github.com/sunpebble/quarry/commit/a5930d1f02bcbadfeacbc4242c263639080dd2cb))
* **data-table:** refocus container after ESC exits edit mode ([91ebff5](https://github.com/sunpebble/quarry/commit/91ebff5797d84532a3c340bf074bd23960bbc40c))
* **deps:** add minimatch as direct dependency for exceljs ([181327b](https://github.com/sunpebble/quarry/commit/181327b3a3a69052b6c2ef7208aca01d93e0b83f))
* **deps:** drop stale sharp darwin-arm64 overrides breaking Apple Silicon ([#232](https://github.com/sunpebble/quarry/issues/232)) ([a6f0cb6](https://github.com/sunpebble/quarry/commit/a6f0cb6e8f71109dfa3913bfce55b781fd35e422))
* **deps:** resolve minimatch module not found error in packaged app ([9a66cfb](https://github.com/sunpebble/quarry/commit/9a66cfb94f4bcb87d4ee090721233b87e81a614f))
* **deps:** resolve sharp native module version conflicts ([feb6478](https://github.com/sunpebble/quarry/commit/feb6478e7bfdbc391976d195b5198e3b779a6261))
* **dev:** skip tour persistence in development mode ([b055f22](https://github.com/sunpebble/quarry/commit/b055f22e9c425632cfd486603f1785cbd02306e1))
* disable pnpm/json-enforce-catalog to keep electron hardcoded ([6222cf2](https://github.com/sunpebble/quarry/commit/6222cf28522f9eec3a3ac39ebfefb3a3f31a50d2))
* **editor:** expand 3-digit hex shorthand in Monaco theme colors ([4f8f288](https://github.com/sunpebble/quarry/commit/4f8f288ce35826adf7d8b424ee01514eb8e8f29c))
* **editor:** improve Monaco editor layout and add missing i18n translations ([22ff103](https://github.com/sunpebble/quarry/commit/22ff1037ff4319c48b4fcf2b658667cb80051fa8))
* **electron:** configure sharp native module and refine UI components ([0d38d13](https://github.com/sunpebble/quarry/commit/0d38d138ca9ca0a9d1f630ed5a8550207e16b586))
* **electron:** deflake plugin archive installation e2e test ([4d8b883](https://github.com/sunpebble/quarry/commit/4d8b88300565cd132a2e6355b6e40cf4b0ffae57))
* **electron:** improve macOS build configuration ([8688842](https://github.com/sunpebble/quarry/commit/868884203ca5a05cfc4b47cd7cb5231ce22abdff))
* **electron:** resolve 7-Zip @ prefix and readable-stream issues in build ([ed5448b](https://github.com/sunpebble/quarry/commit/ed5448b815f046b324ad58c2a8f70f57f1066873))
* ensure Monaco editor theme syncs before dark mode screenshot ([d494398](https://github.com/sunpebble/quarry/commit/d4943988d0a5febd7ca0262c3a29baccef909966))
* expose Monaco to window for screenshot theme synchronization ([bd2fc75](https://github.com/sunpebble/quarry/commit/bd2fc75b3e696b17a5f62a46f6b9ecffe961e518))
* **font:** replace hardcoded font sizes with CSS variables globally ([69a8411](https://github.com/sunpebble/quarry/commit/69a841116bede9460c7731fa1b8f8fec50325e75))
* **font:** replace hardcoded font sizes with CSS variables in schema/data comparison components ([5eba12d](https://github.com/sunpebble/quarry/commit/5eba12d2a5ea601ce376decb138a24a4d0d08e79))
* hardcode electron version for electron-builder compatibility ([60a5be1](https://github.com/sunpebble/quarry/commit/60a5be18908c4709b731fd40663f4c8b5bd5ba66))
* **i18n:** add missing translation keys for tags, savedQueries, and common ([f12db8d](https://github.com/sunpebble/quarry/commit/f12db8db67a847530ea969629f535ceab91f90d9))
* **i18n:** add missing translations for QueryEditor, Tour, Sidebar ([f3e24a3](https://github.com/sunpebble/quarry/commit/f3e24a34103d51e3581a1b6ac9dab3723efb7c00))
* **i18n:** add password-related translation keys for ConnectionSettingsDialog ([a332606](https://github.com/sunpebble/quarry/commit/a3326066b3416408e5e8c1522a381dd96cc9a325))
* **i18n:** replace hardcoded English strings with i18n translations ([bca1adc](https://github.com/sunpebble/quarry/commit/bca1adc92d6279c0c2d87dc497cc08c5f5b6b8dd))
* **i18n:** translate tour step content (title and description) ([84fe7c7](https://github.com/sunpebble/quarry/commit/84fe7c782041a0bd9eb8ef711cddd178b45eb196))
* **i18n:** use correct namespace prefix for password translation keys ([dba8822](https://github.com/sunpebble/quarry/commit/dba8822fe4e87992b5e0f10e1b83be5ccd62a2f3))
* **i18n:** use correct namespace prefixes for translation keys ([249d213](https://github.com/sunpebble/quarry/commit/249d2134dda29918486d05212a6a76515060829b))
* **i18n:** use data-testid for search input selector ([4dfbee1](https://github.com/sunpebble/quarry/commit/4dfbee1488c13de29e7745f3ab42d08cd41a0039))
* improve code quality with regex refactor, SQL injection fixes, and memory leak fix ([d801b0a](https://github.com/sunpebble/quarry/commit/d801b0ae7e26401298bab8f2f99987f536c7186f))
* **ipc:** register missing app:remove-recent-connection handler ([20edf1f](https://github.com/sunpebble/quarry/commit/20edf1f606a76ec2a4daec93b819270fc7b3b031))
* **media-preview:** improve wheel zoom stability and remove devtools ([afdcec4](https://github.com/sunpebble/quarry/commit/afdcec4c54c15830c01a62989a2165bcff072e2f))
* **media-preview:** resolve passive event listener warning ([bbb7bfc](https://github.com/sunpebble/quarry/commit/bbb7bfc011f0f21ee7a7c59ed06e8a22e700eed3))
* **media-preview:** stabilize navigation button position ([c16dcf2](https://github.com/sunpebble/quarry/commit/c16dcf200cd6670fbb5c3d95c69a042d312a3ba4))
* monaco editor not syncing with theme changes ([9172681](https://github.com/sunpebble/quarry/commit/91726817376dbe9e85c8ed089b49bbca99d3d8a8))
* only pass rowVirtualizer when scroll element is ready ([fe851f7](https://github.com/sunpebble/quarry/commit/fe851f7c6827e72913d733fb881f16f93627005f))
* pass virtualItems as prop to memo'd TableBody to fix blank rows on scroll ([9a05f8e](https://github.com/sunpebble/quarry/commit/9a05f8e1941e08f25148582f21313a29092130de))
* **plugins:** replace removed lucide Github icon with FolderGit2 ([cae34c6](https://github.com/sunpebble/quarry/commit/cae34c666b804483a9915eb5afd494caa25012ef))
* **qdrant:** parse point ID as integer when numeric string ([6c6fa22](https://github.com/sunpebble/quarry/commit/6c6fa22b6d490c2a0bcd5a7be9df4ae46fa44e15))
* **qdrant:** use singleton qdrantAdapter in DatabaseManager ([d7694c6](https://github.com/sunpebble/quarry/commit/d7694c6b1acc8ee8ec52d36eff9c89a320921340))
* **query-builder:** fix join type selector button overlap issue ([865976a](https://github.com/sunpebble/quarry/commit/865976ad6c6109ed56f29f11be529a8baa7d7856))
* **query-builder:** improve edge label UX with compact design and z-index ([53c199a](https://github.com/sunpebble/quarry/commit/53c199a623c9c09606b3c37f9e610c9eec25d5d6))
* **query-builder:** improve node layout and connection handle visibility ([e9a5048](https://github.com/sunpebble/quarry/commit/e9a5048fe603e646ca7b08f1af4f13290e657f35))
* **query-builder:** keep labels on their respective edge curves ([9f900c1](https://github.com/sunpebble/quarry/commit/9f900c1f6dae1385c03056d42e361f19ad666640))
* **query-builder:** prevent overlapping edge labels for multiple joins ([c0b3afb](https://github.com/sunpebble/quarry/commit/c0b3afb2f18cc73b16040887bb27c35ef2fd560b))
* **query-builder:** properly separate overlapping edge labels ([9cd88a5](https://github.com/sunpebble/quarry/commit/9cd88a5ea69e2721515536ab1261b404531f7881))
* remove rollupOptions from electron-vite renderer config ([a2cd2ee](https://github.com/sunpebble/quarry/commit/a2cd2eea85342cf872db0e6bd362d24083bb8326))
* render empty tbody when virtualizer is calculating to prevent flicker ([a9d81cb](https://github.com/sunpebble/quarry/commit/a9d81cb852238245a9f3effec992cb3e72087653))
* replace broken var(--gold) references with primary tokens ([93741da](https://github.com/sunpebble/quarry/commit/93741da71cc8a6bb6b6badfc60883e6e6ef6659f))
* reset virtualizer when switching tables to prevent blank areas ([7bfd6a6](https://github.com/sunpebble/quarry/commit/7bfd6a675530cbddac30a311020ba341db3f8a24))
* resolve all ESLint warnings and TypeScript errors ([0f06552](https://github.com/sunpebble/quarry/commit/0f06552fc0ac489b1789f963318ab2d97cbd8b32))
* resolve CI failures from bulk dependency update ([#166](https://github.com/sunpebble/quarry/issues/166)) ([949bb4d](https://github.com/sunpebble/quarry/commit/949bb4d16867991bed602acd4384f75ca8f5b699))
* resolve technical debt and implement batch image export ([3ad6ee6](https://github.com/sunpebble/quarry/commit/3ad6ee6fb46cdd814511a766aeeaeb9499f90c6c))
* resolve typecheck errors, lint warnings, and base-ui 1.1.0 compatibility ([9bf86fb](https://github.com/sunpebble/quarry/commit/9bf86fb91bfcc4120e9c3ea7eff891de10993f48))
* resolve UI, logic, consistency, and multi-entry issues across renderer ([3956ca1](https://github.com/sunpebble/quarry/commit/3956ca1db45601499a0a65401e60eeaadb8fa467))
* resolve virtual scroll blank areas by adding scrollMargin for sticky header ([f7f3087](https://github.com/sunpebble/quarry/commit/f7f3087b249c181de4de38d24e2b0e66c7acdf5b))
* **scroll-area:** apply tabIndex to viewport for proper focus handling ([47434ca](https://github.com/sunpebble/quarry/commit/47434cad58dd1fa067e3bb4e6a9087a182d5403a))
* security hardening, design migration cleanup, and code quality improvements ([62bef2a](https://github.com/sunpebble/quarry/commit/62bef2addb9635906008f22b264b5c096f934c6b))
* set Monaco dark theme when opening query editor for screenshots ([b1a6e60](https://github.com/sunpebble/quarry/commit/b1a6e6080dc43250ff9770573604989995c89269))
* set monaco theme immediately on mount ([4b067c0](https://github.com/sunpebble/quarry/commit/4b067c0a34fbc300f45d0e34878070f9f4f51dbe))
* **shortcuts:** correct data table selector for focus toggle ([23c0a31](https://github.com/sunpebble/quarry/commit/23c0a31a388178899f0edf19a895882c1fd1d8bb))
* **shortcuts:** improve Cmd+W and Cmd+N behavior ([61d6bd5](https://github.com/sunpebble/quarry/commit/61d6bd53a9ee4a711dd01a9bbb149c652dce7ef4))
* **styles:** reduce bg-grid-dot opacity and add glass-gold style ([6150b5a](https://github.com/sunpebble/quarry/commit/6150b5a2d965fa47d5b350c6a2dc79d15a2d4d3e))
* sync Monaco editor theme with app theme in screenshots ([49fad1a](https://github.com/sunpebble/quarry/commit/49fad1af314605a18a53df12d730842561522dcd))
* **table-view:** refocus data table when switching back from gallery view ([fce8037](https://github.com/sunpebble/quarry/commit/fce80374095cce741f3627a561a048cffd07ac87))
* **table:** fix pagination cache invalidation in useClientSearch ([2900602](https://github.com/sunpebble/quarry/commit/29006028dab2e26b4661e1ba37b48a524189af1a))
* **table:** prevent pagination flicker during page navigation ([01799cd](https://github.com/sunpebble/quarry/commit/01799cd42c3519c0133076860ee8915aeba82d45))
* **table:** subscribe to tabsByConnection state for proper reactivity ([48e1ff1](https://github.com/sunpebble/quarry/commit/48e1ff1b4964baf6172ceba34388f1140685986d))
* **table:** use Zustand selector for activeTab to fix pagination reactivity ([686b221](https://github.com/sunpebble/quarry/commit/686b221b0be5f457551b99cac81b64a608ec66c9))
* **ui:** add cursor-pointer style to table list items ([8d958ea](https://github.com/sunpebble/quarry/commit/8d958ea90d0b261be6aa5ebdfdb36ae0ba96f0a1))
* **ui:** add hover underline style to tour CTA button ([ea77e29](https://github.com/sunpebble/quarry/commit/ea77e29f9e84de336dd23818a92e4c8dcec8e524))
* **ui:** align borders and shadows with neobrutalism design system ([277ce40](https://github.com/sunpebble/quarry/commit/277ce4076e8164c02e11f38e224e9090f45074fa))
* **ui:** center welcome screen and website screenshots vertically ([43af900](https://github.com/sunpebble/quarry/commit/43af9001f75eebec35555f16343b9a47ff0647b7))
* **ui:** ensure cursor pointer styles apply with !important ([e709405](https://github.com/sunpebble/quarry/commit/e70940536f4402da51e1c28c58fae54e8597ddee))
* **ui:** final tab style unification pass ([5e01d82](https://github.com/sunpebble/quarry/commit/5e01d829d32b055b7d530731f59893711d71379e))
* **ui:** fix cursor styles for buttons, checkboxes, and interactive elements ([48acaba](https://github.com/sunpebble/quarry/commit/48acabaffac7c884a7efa98cadd59e5e45bfb05d))
* **ui:** make children of interactive elements inherit cursor ([c5addc3](https://github.com/sunpebble/quarry/commit/c5addc333ac5414668e56c08fd130a860007bb9e))
* **ui:** make entire tour CTA button clickable ([e71cf93](https://github.com/sunpebble/quarry/commit/e71cf93b1457642a33582cab22b728110cc9b2eb))
* **ui:** remove offset shadow from tab active states ([95f6db9](https://github.com/sunpebble/quarry/commit/95f6db9fd31672c76b1b3a64768afe489bf44ae1))
* **ui:** remove orphaned aria-invalid border class from input ([7b67d66](https://github.com/sunpebble/quarry/commit/7b67d6685d7f063c2cfdd77e6ef9ecb1abbd263c))
* **ui:** theme dropdown auto-width and remove duplicate tour button ([7c6bc87](https://github.com/sunpebble/quarry/commit/7c6bc87441358efa59c9b3052ea474481f83cf53))
* **ui:** unify all tab styles to consistent neobrutalism pattern ([5ab435a](https://github.com/sunpebble/quarry/commit/5ab435aac4ae85c6f0a7c999dc32c75b71f56097))
* **ui:** unify QueryView tab switcher with neobrutalism tab pattern ([397148a](https://github.com/sunpebble/quarry/commit/397148a1a9f39ef348863727372be86fbd9566f2))
* **vector-search:** integrate useVectorSearch hook and VectorVisualization component ([3db8fc1](https://github.com/sunpebble/quarry/commit/3db8fc1fde71e13b712c565bb1fc4b5a65f5fb7e))
* **vim:** ignore Command key modifier to avoid shortcut conflicts ([33ae007](https://github.com/sunpebble/quarry/commit/33ae007d4a4205de4a2576bc264984fa73a514b7))
* website carousel layout and screenshot capture ([f994968](https://github.com/sunpebble/quarry/commit/f9949684a53f0c4e92d8cdae4b1290d762c781da))
* **website:** fix download button shadow overflow on landing page ([7b11780](https://github.com/sunpebble/quarry/commit/7b117804ddf888faeba2709ee5ae96123fc22e0d))
* 修复字号和字体 CSS 变量默认值与 store 不一致的问题 ([0b3828c](https://github.com/sunpebble/quarry/commit/0b3828c21b6e986b9a33fd08ac590490fda03ee0))


### Performance Improvements

* batch turso adapter mutations ([#103](https://github.com/sunpebble/quarry/issues/103)) ([58316de](https://github.com/sunpebble/quarry/commit/58316de46f4cb6279eedd507f98c3375626f22bb))
* **build:** optimize electron-builder configuration ([78b40d1](https://github.com/sunpebble/quarry/commit/78b40d1aa9d9670ad462b0ad748cc9f615a99db5))
* implement ghost resize for DataGrid column resizing ([128e5c8](https://github.com/sunpebble/quarry/commit/128e5c806188b5dd9a0b82db2ce295964b37df37))
* implement row virtualization for DataTable using @tanstack/react-virtual ([9a2e9bb](https://github.com/sunpebble/quarry/commit/9a2e9bbf838da1e4c95b9c3b597d071fe2e8d83b))
* optimize backup restore with streaming file read ([#104](https://github.com/sunpebble/quarry/issues/104)) ([424c5ba](https://github.com/sunpebble/quarry/commit/424c5baa7e74a54e4add95d20f4edb5ff6470e0a))
* optimize bundle size with direct imports and code splitting ([0e941ca](https://github.com/sunpebble/quarry/commit/0e941cadaa6a7c2d14b6d17463151a3e48e7b9ac))
* optimize DataTable scroll to eliminate blank flashes during fast scrolling ([dce5b50](https://github.com/sunpebble/quarry/commit/dce5b50d99ecad76b8fdf8208c44b6e45ac8a96b))
* Optimize Turso schema fetching with parallel requests ([#101](https://github.com/sunpebble/quarry/issues/101)) ([73a586a](https://github.com/sunpebble/quarry/commit/73a586a24fdafebfc3c820b81f350f97fa7dac94))
* virtualize DataTable rows with @tanstack/react-virtual ([a38fb95](https://github.com/sunpebble/quarry/commit/a38fb95fd19c7cedc99d8108060b9df660aaa34f))
* wrap restore backup loop in transaction ([#105](https://github.com/sunpebble/quarry/issues/105)) ([12e4137](https://github.com/sunpebble/quarry/commit/12e4137449bca43132d501382b155159f75bd03d))


### Reverts

* remove unstable virtual scrolling implementation ([b1802f0](https://github.com/sunpebble/quarry/commit/b1802f0a27f5c6a00ccd11b96a88178764096556))

## [1.15.1](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.15.0...quarry-monorepo-v1.15.1) (2026-03-17)

### Bug Fixes

- resolve CI failures from bulk dependency update ([#166](https://github.com/sunpebble/quarry/issues/166)) ([949bb4d](https://github.com/sunpebble/quarry/commit/949bb4d16867991bed602acd4384f75ca8f5b699))

## [1.15.0](https://github.com/sunpebble/quarry/compare/quarry-monorepo-v1.14.0...quarry-monorepo-v1.15.0) (2026-03-17)

### Features

- **01-01:** invert CSS to dark-first architecture with orange primary ([e8bee02](https://github.com/sunpebble/quarry/commit/e8bee0257987b55c4db139d9628e3d9ce7d86ac9))
- **02-01:** add text hierarchy tokens to shared UI package ([bb38f6a](https://github.com/sunpebble/quarry/commit/bb38f6a85d1c99d4cd8ca972351abc3e522749ec))
- **02-01:** align website text tokens with Slate palette ([642d35a](https://github.com/sunpebble/quarry/commit/642d35aaebf644d29ac600c47b65a9099ccb16b5))
- **02-01:** update globals.css text hierarchy tokens ([296250a](https://github.com/sunpebble/quarry/commit/296250a9818aeb56e7561ded618aef23955bc1b0))
- **05-02:** add height animation and polish to command components ([fc5a390](https://github.com/sunpebble/quarry/commit/fc5a390f2ff62f94a7d548e24d8c7df8e4d6b9ef))
- **05-02:** polish CommandPalette component styling ([1b4facb](https://github.com/sunpebble/quarry/commit/1b4facb8c7f4c8566b6d09f22c70178b27c26dff))
- **05-03:** add inline keyboard shortcuts to Titlebar ([b1ea3f7](https://github.com/sunpebble/quarry/commit/b1ea3f7bf14e4383d06548106e9918031c8a0812))
- **05-03:** add inline shortcuts to remaining menus ([0c2fb94](https://github.com/sunpebble/quarry/commit/0c2fb94763d90c8b2f9207bfed6b135544142f47))
- **05-04:** wire up view context and add view-specific command filtering ([3d709b1](https://github.com/sunpebble/quarry/commit/3d709b134f1c61a97e118254c3a3a2be1e2f8721))
- **06-02:** add glassmorphism to ContextMenuContent ([86bde93](https://github.com/sunpebble/quarry/commit/86bde93c38c9a02d58f5df69a184ddc3500a6eab))
- **06-02:** add glassmorphism to PopoverContent and DropdownMenuContent ([8835d73](https://github.com/sunpebble/quarry/commit/8835d73d5e1b117083017fa048468a9476d6e73c))
- **06-02:** add glassmorphism to TooltipContent and HoverCardContent ([4c910c6](https://github.com/sunpebble/quarry/commit/4c910c6a0a02b964890783b11163c1e5ea9e7e26))
- **07-01:** add group-hover to pinned cells and selection column ([9115e47](https://github.com/sunpebble/quarry/commit/9115e470c196de07a6cd5fee31f9912aed0886d4))
- **07-01:** add row hover states to DataRow ([eda8373](https://github.com/sunpebble/quarry/commit/eda8373536c16968bb0b719dc78514d3515390f0))
- **08-01:** coordinate Monaco themes with design system ([3162992](https://github.com/sunpebble/quarry/commit/31629928e377635070442e84c80bae0c760185f9))
- **09-01:** add primitive palette and restructure semantic tokens ([afdd289](https://github.com/sunpebble/quarry/commit/afdd2895faf33517acaf497b72100d9a66e7f4be))
- **09-01:** add Tailwind v4 [@theme](https://github.com/theme) inline integration ([45ccb97](https://github.com/sunpebble/quarry/commit/45ccb9747c9c87eca261eebf9f01e2f7113a0366))
- **10-01:** remove Pricing section and simplify hero copy ([8755b3e](https://github.com/sunpebble/quarry/commit/8755b3e1a36290dd15dfeae619f0939a7c434730))
- **10-01:** simplify hero section to screenshot-first design ([718aafc](https://github.com/sunpebble/quarry/commit/718aafcf51f879b431cb608b0ffe5ee07fe45f2e))
- **10-02:** implement bento grid layout for Features section ([d92bad6](https://github.com/sunpebble/quarry/commit/d92bad6191514a5424563f6ee879ec795be57263))
- **10-03:** minimize Footer to essential links only ([bd1c0fc](https://github.com/sunpebble/quarry/commit/bd1c0fce4c39ebc7abfdb2acb2bbc88e4e0537dd))
- **10-03:** streamline Download section to single CTA ([78b0cac](https://github.com/sunpebble/quarry/commit/78b0cacb970f7a8a64092d825e57e25972528e4f))
- **11-01:** add Features header scroll animation ([9a93a13](https://github.com/sunpebble/quarry/commit/9a93a13a3e9be69c4192047a1c5e657d84373e0f))
- **11-01:** create useInView hook and convert Download to scroll-triggered ([66b8c1b](https://github.com/sunpebble/quarry/commit/66b8c1b93875b84bc2879444abb78652d63118a4))
- **12-01:** add tableOrganization to RendererStoreSchema ([a3a505e](https://github.com/sunpebble/quarry/commit/a3a505e338d85d02c3ff29f35178716893f9ce01))
- **12-01:** create TagDefinition type with color support ([8b666b4](https://github.com/sunpebble/quarry/commit/8b666b43719fed7d327416d445df50cabf7f0ed9))
- **12-01:** upgrade table-organization-store to use TagDefinition ([9a71746](https://github.com/sunpebble/quarry/commit/9a71746cf99df165872617f201b7c0627f735487))
- **12-02:** add ColoredTagBadge component ([8a35b24](https://github.com/sunpebble/quarry/commit/8a35b2418cc1c43638b57872f59f9ad00ea65387))
- **12-02:** add CreateTagDialog and EditTagDialog components ([abd6155](https://github.com/sunpebble/quarry/commit/abd61554d0e8c9a1f32d8552876180cf08244e74))
- **12-03:** add persistence to table-organization-store ([b694cff](https://github.com/sunpebble/quarry/commit/b694cff54b94e584360ab48aaa8c92c9b9d7f74f))
- **12-03:** add useTagCommands hook for command palette integration ([67a33e2](https://github.com/sunpebble/quarry/commit/67a33e2ee6d7d84c6a4d6d5f25539276b8135ba7))
- **12-03:** update Sidebar to use colored tags and new dialogs ([ec20688](https://github.com/sunpebble/quarry/commit/ec20688245f8efda930f68839a1643ac4816a47c))
- **13-01:** create saved query types ([b2b8c37](https://github.com/sunpebble/quarry/commit/b2b8c378044c69a11358b4fac72451eaedc621da))
- **13-01:** create saved-queries-store with persistence ([2d11945](https://github.com/sunpebble/quarry/commit/2d119455d36b870242f82364321618aeadb86fcc))
- **13-01:** update renderer-store schema for saved queries ([19dba6a](https://github.com/sunpebble/quarry/commit/19dba6ae1df76d08e1f89c97560127bb0b37a46c))
- **13-02:** add ParameterInputDialog component ([334a537](https://github.com/sunpebble/quarry/commit/334a537d214a7615d7f77088d375770e76444074))
- **13-02:** add SavedQueriesBrowser with folder sidebar and QueryCard ([b43be35](https://github.com/sunpebble/quarry/commit/b43be35704ae4184494959583c4bca401d07c224))
- **13-02:** add SaveQueryDialog and EditQueryDialog components ([8f85cf4](https://github.com/sunpebble/quarry/commit/8f85cf454eb24bae81695ca966835b53e2eecca6))
- **13-03:** create useSavedQueryCommands hook for command palette integration ([984242e](https://github.com/sunpebble/quarry/commit/984242e80c1402b48b65fe76c3a4b78f6b7f38b6))
- **13-03:** initialize saved queries store and add i18n ([ea5875d](https://github.com/sunpebble/quarry/commit/ea5875df773c4e66ddcda862d95b2fec6c4fef70))
- **13-03:** integrate saved queries into QueryEditor toolbar ([fa0af3e](https://github.com/sunpebble/quarry/commit/fa0af3ece9f036ee8be10d1baef40d72e0f294e2))
- **14-01:** create SSH credential store service ([85005fc](https://github.com/sunpebble/quarry/commit/85005fc3de21b0658170d71a25018e0504490b1b))
- **14-01:** create SSHTunnel and TunnelManager ([d96e673](https://github.com/sunpebble/quarry/commit/d96e6738890af403706b2d236d79011455fcab94))
- **14-01:** install ssh2 and create SSH types ([18d9d81](https://github.com/sunpebble/quarry/commit/18d9d810ca799766f4704fdab75c6fd1bcef7f35))
- **14-02:** add i18n translations for SSH tunnel UI ([78bf6bc](https://github.com/sunpebble/quarry/commit/78bf6bcf13a3a76fe49d531f5a3b7183d5eafb47))
- **14-02:** create SSHTunnelConfig component ([36bb36f](https://github.com/sunpebble/quarry/commit/36bb36fd3e3b2d3205f3387675863dfea70b8c82))
- **14-02:** integrate SSHTunnelConfig into ServerConnectionDialog ([a27d759](https://github.com/sunpebble/quarry/commit/a27d75918e44a241ca4153f2af4a90d96118241b))
- **14-03:** add SSH IPC handlers and preload bridge ([12ba813](https://github.com/sunpebble/quarry/commit/12ba813b6fdafeb1621dd878f4a25e4bb6c11b33))
- **14-03:** add tunnel status indicator and connection store updates ([1f7bb79](https://github.com/sunpebble/quarry/commit/1f7bb7951974c90c56dcc2ac343baa400c13aaf4))
- **14-03:** integrate SSH tunnel creation into database connection flow ([2e3d9e9](https://github.com/sunpebble/quarry/commit/2e3d9e9ddc73558f81ff873245ce018b022006af))
- **15:** add AI natural language query feature ([e2a51d9](https://github.com/sunpebble/quarry/commit/e2a51d9ad9532aba3971712d35c9c3f2414a648a))
- **a11y:** add ARIA labels to icon-only buttons in Titlebar and Toolbar ([#135](https://github.com/sunpebble/quarry/issues/135)) ([75b4e98](https://github.com/sunpebble/quarry/commit/75b4e98fcffa123d067e7e66cdbcd8b311c0bda9))
- add 'All' option to pagination for viewing all rows without limit ([d2fb28b](https://github.com/sunpebble/quarry/commit/d2fb28b677e7566f65de4ad6060e354a4be36131))
- add advanced database tools suite ([ef3696a](https://github.com/sunpebble/quarry/commit/ef3696ae8fb0fbd56929149364d55fbd6d5b225f))
- add application logging system for main process ([814e04c](https://github.com/sunpebble/quarry/commit/814e04c839c27d934425a288a17b8f35ab21e5af))
- add aria labels to TableView buttons ([#151](https://github.com/sunpebble/quarry/issues/151)) ([d7e8acb](https://github.com/sunpebble/quarry/commit/d7e8acb5fd8fc1802b2de30a9ceb7284def34e00))
- Add aria-label to icon-only buttons in AI Agent components ([#148](https://github.com/sunpebble/quarry/issues/148)) ([0f72f42](https://github.com/sunpebble/quarry/commit/0f72f42f0260a8536440a78f22aa6e29c59ef783))
- add async column distribution for Qdrant and refine UI components ([d004598](https://github.com/sunpebble/quarry/commit/d004598a1003195ad1e5cf5721ec4c338f81fd61))
- add show/hide password toggle to PasswordDialog ([#140](https://github.com/sunpebble/quarry/issues/140)) ([7332294](https://github.com/sunpebble/quarry/commit/7332294d1d29a71102c0ac299dc76fd3d663973a))
- add Turso edge database support ([0f5449e](https://github.com/sunpebble/quarry/commit/0f5449e3cdc45744c94b1110e2afff90298236a3))
- **agent:** add Vercel AI SDK dependencies and type definitions ([d8b1783](https://github.com/sunpebble/quarry/commit/d8b17834906e306e1fec1c4ab5c18b20e56bcd13))
- **agent:** convert AI chat from modal to sidebar layout ([9f62dd2](https://github.com/sunpebble/quarry/commit/9f62dd2fcb9f516472c1ab2b332d6d38c4f8d163))
- **agent:** implement AI Agent UI components (Phase 3) ([126c94b](https://github.com/sunpebble/quarry/commit/126c94bd44b38424f29bce4c3caf06a2c41fab22))
- **agent:** implement main process AI agent with Vercel AI SDK ([b0564b6](https://github.com/sunpebble/quarry/commit/b0564b66ed4fcd789b3d4e6d056823441fe94cf6))
- **ai:** implement per-provider AI settings and Claude Code info display ([780b3bc](https://github.com/sunpebble/quarry/commit/780b3bc7a5b3c195273bfe79aefb6c661e9db20c))
- create QueryHistoryFilters component with status and date range ([2731dad](https://github.com/sunpebble/quarry/commit/2731dadc640adc428cceb5b0274c96ff6852c3d8))
- **dashboard:** optimize database dashboard with parallel queries, insights, and polished UI ([c7d483f](https://github.com/sunpebble/quarry/commit/c7d483f8fee0651dc705ba6332c7284cfc742f71))
- **data-table:** add row animations and optimize column resize performance ([3e7816f](https://github.com/sunpebble/quarry/commit/3e7816f6639f3850a912eb752326eedacd87b12f))
- **database-manager:** register TursoAdapter ([a627072](https://github.com/sunpebble/quarry/commit/a627072b0068510c85d62657a5ae5acb8a0edc44))
- **database:** add getColumnDistribution method for full table aggregation ([5f3a93f](https://github.com/sunpebble/quarry/commit/5f3a93f467630db1b3844dc553fe21046796c5cf))
- **datagrid:** add accessibility attributes and memoization ([04c210b](https://github.com/sunpebble/quarry/commit/04c210ba09c4eebbce750d60165d083b27566a1e))
- **design:** unify design language across Electron and website ([#67](https://github.com/sunpebble/quarry/issues/67)) ([b3fb22a](https://github.com/sunpebble/quarry/commit/b3fb22a7f927b6f2fa9e585604f255c32c582473))
- **electron:** add screenshot capture script for marketing materials ([f064f0c](https://github.com/sunpebble/quarry/commit/f064f0cb6b88119ed3c2873f9c20dc0f55403c5f))
- **i18n:** add Chinese translations for connection and tab menus ([21ff6ff](https://github.com/sunpebble/quarry/commit/21ff6ff62dc4a9058d4ca7c025b32fe0f96f5061))
- **i18n:** add Chinese translations for Pro license and filter dialogs ([c683dd7](https://github.com/sunpebble/quarry/commit/c683dd779e346ad8c8b0615233d7a2732b98f728))
- **i18n:** add Chinese translations for welcome dialog and tour ([0ce25e5](https://github.com/sunpebble/quarry/commit/0ce25e5c5a73178ff756be999c765029974d791c))
- **i18n:** add contextMenu, diagram, sidebar, quit translation keys ([789ff2b](https://github.com/sunpebble/quarry/commit/789ff2b4ac04acc2629bbccf2fd6af7c8ef402cb))
- **i18n:** add English translations for keyboard shortcut actions ([4298195](https://github.com/sunpebble/quarry/commit/42981954a24f8c39b4f05d0d61a8f7d0f957960f))
- **i18n:** add missing query builder translations ([28b60bb](https://github.com/sunpebble/quarry/commit/28b60bb6fa68ba48c00225b42679f9cad24cacbf))
- **i18n:** add missing translation keys and complete i18n coverage ([c876ca3](https://github.com/sunpebble/quarry/commit/c876ca36af07620243449459165539abdadacc54))
- **i18n:** add translation for Custom provider option ([380c188](https://github.com/sunpebble/quarry/commit/380c188b4d5ab939049ff44378e5588a1c332e20))
- **i18n:** add translations for FolderTree and ProfileForm components ([0d3ee63](https://github.com/sunpebble/quarry/commit/0d3ee63ca1c3e3552b05d683aff1d7a8a69b98b8))
- **i18n:** add translations for ProfileManager and DiffPreview components ([4573674](https://github.com/sunpebble/quarry/commit/45736741752045d2b2e265d2444c4a788145b31f))
- **i18n:** add translations for SelectionStats and keyboard shortcuts ([e9e4cc8](https://github.com/sunpebble/quarry/commit/e9e4cc821050c2bd2839ba59e8d1176a68294033))
- **i18n:** complete i18n translations for hardcoded strings ([ade9cc4](https://github.com/sunpebble/quarry/commit/ade9cc4a2809422b55ee062d090d7dc704de45c5))
- **i18n:** finalize i18n implementation across all components ([0c3fcbd](https://github.com/sunpebble/quarry/commit/0c3fcbd1703c9b6620f6f6f903ceb48053dd1827))
- **i18n:** fix errors and add missing translations ([db6d5c3](https://github.com/sunpebble/quarry/commit/db6d5c3e67b4c54fe5fed1fae0cc9b31c2c90478))
- **i18n:** translate Command Palette and all commands ([6f38bd8](https://github.com/sunpebble/quarry/commit/6f38bd85748b8323459cc70f82b55f5f03d733e9))
- **i18n:** translate Compare view panels ([88e86d7](https://github.com/sunpebble/quarry/commit/88e86d743c8df72ac91c7e51b5cd3c07634ab9a4))
- **i18n:** translate connection context menu items ([a13c8cc](https://github.com/sunpebble/quarry/commit/a13c8cc88f18ee5181f96a437543ff6dcd33bc9d))
- **i18n:** translate ConnectionSettingsDialog ([dc17ea1](https://github.com/sunpebble/quarry/commit/dc17ea10438660342e26cddd93735abdf319e2a1))
- **i18n:** translate database page and activity bar ([1cb4df7](https://github.com/sunpebble/quarry/commit/1cb4df799a0d608213f0d105db975be1f59969c0))
- **i18n:** translate Edit menu items (Undo, Redo, Cut, Copy, Paste, Delete, Select All) ([6724392](https://github.com/sunpebble/quarry/commit/672439279005ea481f117013064b48e11ca5629f))
- **i18n:** translate Keyboard Shortcuts dialog ([8e3d0fd](https://github.com/sunpebble/quarry/commit/8e3d0fda44b86303cf292b63812c087fc944542a))
- **i18n:** translate native Electron menu ([5ec3b0c](https://github.com/sunpebble/quarry/commit/5ec3b0ce87554a07bdfde84129cefd3c500cc249))
- **i18n:** translate ProfileManager and fix Cancel button ([e8e3f21](https://github.com/sunpebble/quarry/commit/e8e3f216e55b08d3708f02865fdd00bea93b5ae9))
- **i18n:** translate QuickFilterTags and ColumnStats ([d266c8e](https://github.com/sunpebble/quarry/commit/d266c8ee7bb0d7f63961f541714866542dc1b4eb))
- **i18n:** translate SettingsDialog Vim/Font/Tab/Session sections ([a006340](https://github.com/sunpebble/quarry/commit/a0063405e8e6eba67f2309c723ae7966496a0293))
- **i18n:** translate sidebar filter and sort options ([0228b9a](https://github.com/sunpebble/quarry/commit/0228b9ae29de0a9d4b9fc0ce83e3dfdda2eddb4d))
- **i18n:** translate table context menu ([5e31735](https://github.com/sunpebble/quarry/commit/5e31735801b18d43eb106da8b7992f42c7d345f3))
- **i18n:** translate TableView and SchemaDetailsPanel ([79786a1](https://github.com/sunpebble/quarry/commit/79786a17c86189046747e45aaca91df2926b6a00))
- **i18n:** translate theme switcher and column statistics ([d7ae052](https://github.com/sunpebble/quarry/commit/d7ae0524b29bc17d328b9089bb2bc670329a5135))
- **i18n:** translate Toolbar and LayoutButtons ([ff722e0](https://github.com/sunpebble/quarry/commit/ff722e0666a047f996bb5705a89e6326bca75a73))
- **i18n:** translate WelcomeScreen and FeatureShowcase ([d4d4d74](https://github.com/sunpebble/quarry/commit/d4d4d74676cb3d526deec3f33fcb064a1f3c0fe9))
- **image-gallery:** add image gallery feature for viewing images in database ([76a1791](https://github.com/sunpebble/quarry/commit/76a17919867425e9bd9e18432567b3b88596c342))
- **image-gallery:** add quarry:// protocol with caching and HEAD preflight check ([3755c31](https://github.com/sunpebble/quarry/commit/3755c31c32eebe26b5fe1186bca2889d74d272f4))
- implement Stripe Pro subscription integration ([0b83781](https://github.com/sunpebble/quarry/commit/0b8378129843fb636c0746f1cca02f4fe6bac642))
- improve UX for data table and media gallery ([01f5435](https://github.com/sunpebble/quarry/commit/01f5435c9c9c751772d5c9a452c379197fd369f0))
- **license-api:** add email notification for license key delivery ([4e3d34f](https://github.com/sunpebble/quarry/commit/4e3d34f2e6697fac7b22902e7fcb5dea4d7963d8))
- **media-gallery:** add video streaming support and locate-in-table feature ([c09ee63](https://github.com/sunpebble/quarry/commit/c09ee63753e7515ed0ecb971e65494dd4f00a91b))
- **media-gallery:** add video support with ffprobe detection and Range requests ([cf122f8](https://github.com/sunpebble/quarry/commit/cf122f83469b5bc7b66d9a4b04bea9f8b41033b8))
- **media-preview:** add comprehensive metadata display ([99ef49e](https://github.com/sunpebble/quarry/commit/99ef49e22c02b65e024bfaac3bc34ade0abf6bab))
- **media-preview:** add file path display with copy and reveal actions ([e0cf1b5](https://github.com/sunpebble/quarry/commit/e0cf1b55cd2260ffcb5f76e77ad3db5f69559d37))
- **media-preview:** enhance viewer with video metadata and zoom/pan controls ([c252506](https://github.com/sunpebble/quarry/commit/c252506a93ef2b04a0ba0685d13e3229a9fb7d00))
- merge Schema Compare and Data Compare into unified Compare view ([cb7943c](https://github.com/sunpebble/quarry/commit/cb7943c30dabf9b49b04719c0d61c8aec8e0cac2))
- migrate auto-update to Cloudflare R2 and enhance UI components ([4fd1684](https://github.com/sunpebble/quarry/commit/4fd1684d2ddc5bc76ca78b9181620d814047d0bf))
- **payment:** refactor license dialog to wizard-style flow with new components ([#60](https://github.com/sunpebble/quarry/issues/60)) ([fc64ff8](https://github.com/sunpebble/quarry/commit/fc64ff80fec1b21b5017e95d1df83f14713de850))
- **perf:** wrap sqlite changes in transaction ([#102](https://github.com/sunpebble/quarry/issues/102)) ([5110204](https://github.com/sunpebble/quarry/commit/51102046376f9eccf4a2646d2a8fe453824f48ae))
- **qdrant:** add Qdrant vector database support (Phase 1 MVP) ([#74](https://github.com/sunpebble/quarry/issues/74)) ([59b22b8](https://github.com/sunpebble/quarry/commit/59b22b8237b9e1c2b932d79c0068e036fe8af626))
- **qdrant:** add vector search functionality (Phase 2) ([#75](https://github.com/sunpebble/quarry/issues/75)) ([4e0902a](https://github.com/sunpebble/quarry/commit/4e0902a3aa6d60f312360779e2d5e9ec2317adf1))
- **qdrant:** complete vector search integration with UI improvements ([570afbd](https://github.com/sunpebble/quarry/commit/570afbd949f81eb5376f74d16d737884399ac3bb))
- **query-builder:** add DBeaver-style interactions and visual enhancements ([b295a5d](https://github.com/sunpebble/quarry/commit/b295a5dec518d473e89d52b6ed515297fd3a5b85))
- **query-history:** integrate filters into QueryEditor history panel ([5ec95b2](https://github.com/sunpebble/quarry/commit/5ec95b2f9c9f2d02d2ccabbdcb3906818e2c8d80))
- **query:** merge SQL Editor and Query Builder into unified Query View ([5d1a412](https://github.com/sunpebble/quarry/commit/5d1a4126913544544b074c722ebc953904c3824b))
- remove /debug/callback endpoint ([#99](https://github.com/sunpebble/quarry/issues/99)) ([b741d63](https://github.com/sunpebble/quarry/commit/b741d638a699514e279c8af9055aa2954701076f))
- **renderer:** add row context menu to TableBody component ([3ee5773](https://github.com/sunpebble/quarry/commit/3ee57730f35430d98bd22cc33e19a840d9d9959c))
- **renderer:** add SQL INSERT generator utility for clipboard operations ([ddbee66](https://github.com/sunpebble/quarry/commit/ddbee667c19fe865f7e0385c780ff53627b7f1b3))
- **renderer:** update DataTable to pass context menu props to TableBody ([42bee83](https://github.com/sunpebble/quarry/commit/42bee8338f880c4e91cce42ab54eecc0fb47ee7d))
- **shortcuts:** add default bindings for table navigation ([10b9c23](https://github.com/sunpebble/quarry/commit/10b9c238d429e85e1bf88bd3aba0348ce1894a80))
- **shortcuts:** add focus toggle between sidebar and data table ([fbe3696](https://github.com/sunpebble/quarry/commit/fbe3696d9e6c2438d1d400c9ee0c52652a1abe53))
- **shortcuts:** add SQL log toggle shortcut and update AI Agent shortcut ([150a0b5](https://github.com/sunpebble/quarry/commit/150a0b5f350a97025b5dd8040eaaa7505aee62ae))
- **shortcuts:** add table.next-table and table.prev-table action types ([4969ae7](https://github.com/sunpebble/quarry/commit/4969ae78c8c4eebefda39f567e2ac623ef6c57c5))
- **shortcuts:** create useTableNavigation hook for table navigation ([22281c9](https://github.com/sunpebble/quarry/commit/22281c9ce2aa152b6dd55d3cdaf4df2129249d7a))
- **skeleton-loading:** add skeleton loading states across components ([#68](https://github.com/sunpebble/quarry/issues/68)) ([50e128d](https://github.com/sunpebble/quarry/commit/50e128d284764ae80e485ac2ec9cce006cabce35))
- **streaming:** add streaming API for virtual scrolling ([0bda3cd](https://github.com/sunpebble/quarry/commit/0bda3cdf5261581f8144bbec7089c0e4aa104612))
- **table:** add image gallery view for visualizing image data ([a2b310b](https://github.com/sunpebble/quarry/commit/a2b310bfba921483a0dd4f968ff031e58b2127c0))
- **turso:** implement TursoAdapter with libsql client ([2dc94e1](https://github.com/sunpebble/quarry/commit/2dc94e141edc76a8ed95411031e76ddf0aca2402))
- **turso:** implement TursoPlatformService for API integration ([f68bdb2](https://github.com/sunpebble/quarry/commit/f68bdb2477ea0e7176163b106d5076d4c798814e))
- **types:** add Turso database type and connection config fields ([c01770b](https://github.com/sunpebble/quarry/commit/c01770b98a2304d9a0e5ce18df1a38bd3ba8a4a1))
- **ui:** add brand color, enhance interactions, and add view shortcuts ([eca2f4e](https://github.com/sunpebble/quarry/commit/eca2f4e3144fd4e0fd3374dcadc915cb40d52fa1))
- **ui:** add Turso database connection support ([bc10a91](https://github.com/sunpebble/quarry/commit/bc10a91e99397a7bd8a42848acb6aacdc56704dc))
- **ui:** apply neobrutalism design system to UI components ([fec3639](https://github.com/sunpebble/quarry/commit/fec363992097a11938bd51b12a01268ae4bffb49))
- **ui:** comprehensive UI polish and micro-interactions ([651f4f3](https://github.com/sunpebble/quarry/commit/651f4f320eef5ed13a242d0ae91d165407cafee7))
- **ui:** implement Data Sanctum design system across application ([51bf362](https://github.com/sunpebble/quarry/commit/51bf362dea75077edc8f94065f58747b96f81323))
- **ui:** redesign ER diagram controls and optimize pagination layout ([821c707](https://github.com/sunpebble/quarry/commit/821c70743a0f9bff0a9c7038517ef8b46d679f67))
- update ([5348925](https://github.com/sunpebble/quarry/commit/5348925bd541b71638f2b5da3b78e88e2091c7f0))
- **ux:** improve accessibility of SchemaDetailsPanel close button and sections ([#143](https://github.com/sunpebble/quarry/issues/143)) ([1a4a619](https://github.com/sunpebble/quarry/commit/1a4a61976c259fc5b504cffd423160fa7a9a87e2))
- **vector-search:** add 3D rotation and zoom interaction ([98323e5](https://github.com/sunpebble/quarry/commit/98323e5c009087e704af7f662fe42fe549f3ee6b))
- **vector-search:** add hover tooltip and enlarge effect for visualization ([658c41b](https://github.com/sunpebble/quarry/commit/658c41b2650330403c8fb47ae75c945309277d8e))
- **vim:** add Ctrl+D and Ctrl+U for half-page navigation ([2d17a98](https://github.com/sunpebble/quarry/commit/2d17a9810d57236ccc9b90ddc68774a84fc5dd41))
- **website:** add official website with i18n and a11y ([f49fa75](https://github.com/sunpebble/quarry/commit/f49fa75149fbde7831f1b8db16ed08a99f90dfe0))
- **website:** add Pricing section with subscription plans ([6c9c5be](https://github.com/sunpebble/quarry/commit/6c9c5beb6a8170d78ef38ed712acc933ee56f834))
- **website:** add Remotion promo video and new landing page sections ([b46f81a](https://github.com/sunpebble/quarry/commit/b46f81ab46bfbc06c27ad1a65d9fc9a2819f41d5))
- **website:** connect pricing buttons to Stripe checkout ([3a0b856](https://github.com/sunpebble/quarry/commit/3a0b856b2a98864ba66042cf9e723d059bc7fd18))
- **website:** enhance SEO meta tags and improve marketing copy ([de4cafd](https://github.com/sunpebble/quarry/commit/de4cafde7828eb1cf9de57023aa758bb5e475d48))
- **website:** redesign with Fresh Modern design system ([#87](https://github.com/sunpebble/quarry/issues/87)) ([d92c178](https://github.com/sunpebble/quarry/commit/d92c17832338b7ad83be3a592c927377cf271e40))

### Bug Fixes

- **01:** cap floating-dock border-radius at 12px ([6c4b1cb](https://github.com/sunpebble/quarry/commit/6c4b1cb9694ae57feb045519fa83e62084bf904c))
- **06-03:** remove scale and shadow hover from Card ([a6b5b42](https://github.com/sunpebble/quarry/commit/a6b5b4260c497b107aae92b65f1da0f9d3211ba0))
- **09-02:** migrate base styles to semantic tokens in index.css ([f535abc](https://github.com/sunpebble/quarry/commit/f535abc99a356ca36ce9bea92695bcdae15f5726))
- **11:** fix className template to properly add visible class ([b3fa4f3](https://github.com/sunpebble/quarry/commit/b3fa4f3b9659bb682a6394dc10a6749f1cc39070))
- add key to DataTable to force remount on table switch, fixing virtualizer state ([689177c](https://github.com/sunpebble/quarry/commit/689177cde7fa37701a13694c68cb039e859b7e3b))
- add quarry protocol to CSP media-src for video playback ([3200b2c](https://github.com/sunpebble/quarry/commit/3200b2c3ac99cddb9fa65d10347cb996f3b474f5))
- **agent:** correct user avatar position in chat messages ([22cf971](https://github.com/sunpebble/quarry/commit/22cf9711fda93303642a3727e7b49e6a76bea6b3))
- **agent:** improve AI response language and reasoning display ([99f5e50](https://github.com/sunpebble/quarry/commit/99f5e508233a5a3e042175504d5d2b5073c83a6a))
- **agent:** use lazy state initialization for session ID ([cd65e13](https://github.com/sunpebble/quarry/commit/cd65e13131beda345921b1aa9dd0147f7218a4a6))
- **backup:** 修复 restoreBackup 流式解析缺少索引更新的 bug ([ac2f7c1](https://github.com/sunpebble/quarry/commit/ac2f7c127abc11296bb5b3b706b1cb62454d5723))
- build verification fixes for Ink & Paper design migration ([b6bbea0](https://github.com/sunpebble/quarry/commit/b6bbea0ed1c20192b0e265745d7095c88be13760))
- **chart:** prevent pie chart from being clipped in Data Type Distribution ([394b7e6](https://github.com/sunpebble/quarry/commit/394b7e62fbe58f382182684f3ae5b922780abf29))
- **connection-dialog:** prevent UI interaction gap during connection ([59cd695](https://github.com/sunpebble/quarry/commit/59cd6958261cd2a202c95cc862e75a4848f45a16))
- **connections:** disable connection actions while loading ([fc229fd](https://github.com/sunpebble/quarry/commit/fc229fdfec191ef6bef1f69316830797111794bf))
- correct ConfirmDialog prop name (confirmText -&gt; confirmLabel) ([bd3300d](https://github.com/sunpebble/quarry/commit/bd3300d7670e4baf072dadce0bd326a174af5bcb))
- **dashboard:** add spacing between tabs and content, fix data type grid layout ([4b5103f](https://github.com/sunpebble/quarry/commit/4b5103fc425e58a1138fdde9ab78f7279c4925d5))
- **dashboard:** enable scrolling by replacing overflow-hidden with min-h-0 ([81f67c3](https://github.com/sunpebble/quarry/commit/81f67c35a472f04ad021911a88f513cbac077ee7))
- **dashboard:** implement proper ScrollArea pattern with min-h-0 wrapper for all tabs ([8141f02](https://github.com/sunpebble/quarry/commit/8141f027cb26583e4b577e863a57592460353b76))
- **dashboard:** prevent content overflow with overflow-hidden on DialogContent ([df08e07](https://github.com/sunpebble/quarry/commit/df08e07063eb55680fee00a8230abc041a7afb0d))
- **dashboard:** prevent text wrapping in stat cards with whitespace-nowrap ([3fa40d1](https://github.com/sunpebble/quarry/commit/3fa40d13b3aa458d5ab19a501893d5710cd83927))
- **dashboard:** replace ScrollArea with native overflow-auto for proper scrolling ([a228c75](https://github.com/sunpebble/quarry/commit/a228c7562f83e175f293ce2f2876f5cb20ba1135))
- **dashboard:** resolve database dashboard query and chart display issues ([216b6f7](https://github.com/sunpebble/quarry/commit/216b6f75fa19a7bd74eb8511e90759439f932ca7))
- **dashboard:** restore vertical stat card layout to prevent truncation ([ce2c245](https://github.com/sunpebble/quarry/commit/ce2c245bf96300d3ae48f368d08ee0263162f4fd))
- **dashboard:** simplify ScrollArea structure with min-h-0 on TabsContent ([9044518](https://github.com/sunpebble/quarry/commit/9044518af0d80bbd744333e724924a72901ae4b4))
- **data-table:** add horizontal auto-scroll when navigating cells with keyboard ([a5930d1](https://github.com/sunpebble/quarry/commit/a5930d1f02bcbadfeacbc4242c263639080dd2cb))
- **data-table:** refocus container after ESC exits edit mode ([91ebff5](https://github.com/sunpebble/quarry/commit/91ebff5797d84532a3c340bf074bd23960bbc40c))
- **deps:** add minimatch as direct dependency for exceljs ([181327b](https://github.com/sunpebble/quarry/commit/181327b3a3a69052b6c2ef7208aca01d93e0b83f))
- **deps:** resolve minimatch module not found error in packaged app ([9a66cfb](https://github.com/sunpebble/quarry/commit/9a66cfb94f4bcb87d4ee090721233b87e81a614f))
- **deps:** resolve sharp native module version conflicts ([feb6478](https://github.com/sunpebble/quarry/commit/feb6478e7bfdbc391976d195b5198e3b779a6261))
- **dev:** skip tour persistence in development mode ([b055f22](https://github.com/sunpebble/quarry/commit/b055f22e9c425632cfd486603f1785cbd02306e1))
- disable pnpm/json-enforce-catalog to keep electron hardcoded ([6222cf2](https://github.com/sunpebble/quarry/commit/6222cf28522f9eec3a3ac39ebfefb3a3f31a50d2))
- **editor:** expand 3-digit hex shorthand in Monaco theme colors ([4f8f288](https://github.com/sunpebble/quarry/commit/4f8f288ce35826adf7d8b424ee01514eb8e8f29c))
- **editor:** improve Monaco editor layout and add missing i18n translations ([22ff103](https://github.com/sunpebble/quarry/commit/22ff1037ff4319c48b4fcf2b658667cb80051fa8))
- **electron:** configure sharp native module and refine UI components ([0d38d13](https://github.com/sunpebble/quarry/commit/0d38d138ca9ca0a9d1f630ed5a8550207e16b586))
- **electron:** improve macOS build configuration ([8688842](https://github.com/sunpebble/quarry/commit/868884203ca5a05cfc4b47cd7cb5231ce22abdff))
- **electron:** resolve 7-Zip @ prefix and readable-stream issues in build ([ed5448b](https://github.com/sunpebble/quarry/commit/ed5448b815f046b324ad58c2a8f70f57f1066873))
- ensure Monaco editor theme syncs before dark mode screenshot ([d494398](https://github.com/sunpebble/quarry/commit/d4943988d0a5febd7ca0262c3a29baccef909966))
- expose Monaco to window for screenshot theme synchronization ([bd2fc75](https://github.com/sunpebble/quarry/commit/bd2fc75b3e696b17a5f62a46f6b9ecffe961e518))
- **font:** replace hardcoded font sizes with CSS variables globally ([69a8411](https://github.com/sunpebble/quarry/commit/69a841116bede9460c7731fa1b8f8fec50325e75))
- **font:** replace hardcoded font sizes with CSS variables in schema/data comparison components ([5eba12d](https://github.com/sunpebble/quarry/commit/5eba12d2a5ea601ce376decb138a24a4d0d08e79))
- hardcode electron version for electron-builder compatibility ([60a5be1](https://github.com/sunpebble/quarry/commit/60a5be18908c4709b731fd40663f4c8b5bd5ba66))
- **i18n:** add missing translation keys for tags, savedQueries, and common ([f12db8d](https://github.com/sunpebble/quarry/commit/f12db8db67a847530ea969629f535ceab91f90d9))
- **i18n:** add missing translations for QueryEditor, Tour, Sidebar ([f3e24a3](https://github.com/sunpebble/quarry/commit/f3e24a34103d51e3581a1b6ac9dab3723efb7c00))
- **i18n:** add password-related translation keys for ConnectionSettingsDialog ([a332606](https://github.com/sunpebble/quarry/commit/a3326066b3416408e5e8c1522a381dd96cc9a325))
- **i18n:** correct window.quarry API reference ([8006ddf](https://github.com/sunpebble/quarry/commit/8006ddfc6b4d62532441a22a2a35c52e58da42a0))
- **i18n:** replace hardcoded English strings with i18n translations ([bca1adc](https://github.com/sunpebble/quarry/commit/bca1adc92d6279c0c2d87dc497cc08c5f5b6b8dd))
- **i18n:** translate tour step content (title and description) ([84fe7c7](https://github.com/sunpebble/quarry/commit/84fe7c782041a0bd9eb8ef711cddd178b45eb196))
- **i18n:** use correct namespace prefix for password translation keys ([dba8822](https://github.com/sunpebble/quarry/commit/dba8822fe4e87992b5e0f10e1b83be5ccd62a2f3))
- **i18n:** use correct namespace prefixes for translation keys ([249d213](https://github.com/sunpebble/quarry/commit/249d2134dda29918486d05212a6a76515060829b))
- **i18n:** use data-testid for search input selector ([4dfbee1](https://github.com/sunpebble/quarry/commit/4dfbee1488c13de29e7745f3ab42d08cd41a0039))
- **ipc:** register missing app:remove-recent-connection handler ([20edf1f](https://github.com/sunpebble/quarry/commit/20edf1f606a76ec2a4daec93b819270fc7b3b031))
- **media-preview:** improve wheel zoom stability and remove devtools ([afdcec4](https://github.com/sunpebble/quarry/commit/afdcec4c54c15830c01a62989a2165bcff072e2f))
- **media-preview:** resolve passive event listener warning ([bbb7bfc](https://github.com/sunpebble/quarry/commit/bbb7bfc011f0f21ee7a7c59ed06e8a22e700eed3))
- **media-preview:** stabilize navigation button position ([c16dcf2](https://github.com/sunpebble/quarry/commit/c16dcf200cd6670fbb5c3d95c69a042d312a3ba4))
- monaco editor not syncing with theme changes ([9172681](https://github.com/sunpebble/quarry/commit/91726817376dbe9e85c8ed089b49bbca99d3d8a8))
- only pass rowVirtualizer when scroll element is ready ([fe851f7](https://github.com/sunpebble/quarry/commit/fe851f7c6827e72913d733fb881f16f93627005f))
- pass virtualItems as prop to memo'd TableBody to fix blank rows on scroll ([9a05f8e](https://github.com/sunpebble/quarry/commit/9a05f8e1941e08f25148582f21313a29092130de))
- **preload:** bundle dependencies for sandbox compatibility ([029bfb3](https://github.com/sunpebble/quarry/commit/029bfb3e84d8a8dad6e0c66ab2772af310a1cddb))
- **qdrant:** parse point ID as integer when numeric string ([6c6fa22](https://github.com/sunpebble/quarry/commit/6c6fa22b6d490c2a0bcd5a7be9df4ae46fa44e15))
- **qdrant:** use singleton qdrantAdapter in DatabaseManager ([d7694c6](https://github.com/sunpebble/quarry/commit/d7694c6b1acc8ee8ec52d36eff9c89a320921340))
- **query-builder:** fix join type selector button overlap issue ([865976a](https://github.com/sunpebble/quarry/commit/865976ad6c6109ed56f29f11be529a8baa7d7856))
- **query-builder:** improve edge label UX with compact design and z-index ([53c199a](https://github.com/sunpebble/quarry/commit/53c199a623c9c09606b3c37f9e610c9eec25d5d6))
- **query-builder:** improve node layout and connection handle visibility ([e9a5048](https://github.com/sunpebble/quarry/commit/e9a5048fe603e646ca7b08f1af4f13290e657f35))
- **query-builder:** keep labels on their respective edge curves ([9f900c1](https://github.com/sunpebble/quarry/commit/9f900c1f6dae1385c03056d42e361f19ad666640))
- **query-builder:** prevent overlapping edge labels for multiple joins ([c0b3afb](https://github.com/sunpebble/quarry/commit/c0b3afb2f18cc73b16040887bb27c35ef2fd560b))
- **query-builder:** properly separate overlapping edge labels ([9cd88a5](https://github.com/sunpebble/quarry/commit/9cd88a5ea69e2721515536ab1261b404531f7881))
- remove rollupOptions from electron-vite renderer config ([a2cd2ee](https://github.com/sunpebble/quarry/commit/a2cd2eea85342cf872db0e6bd362d24083bb8326))
- render empty tbody when virtualizer is calculating to prevent flicker ([a9d81cb](https://github.com/sunpebble/quarry/commit/a9d81cb852238245a9f3effec992cb3e72087653))
- replace broken var(--gold) references with primary tokens ([93741da](https://github.com/sunpebble/quarry/commit/93741da71cc8a6bb6b6badfc60883e6e6ef6659f))
- reset virtualizer when switching tables to prevent blank areas ([7bfd6a6](https://github.com/sunpebble/quarry/commit/7bfd6a675530cbddac30a311020ba341db3f8a24))
- resolve all ESLint warnings and TypeScript errors ([0f06552](https://github.com/sunpebble/quarry/commit/0f06552fc0ac489b1789f963318ab2d97cbd8b32))
- resolve technical debt and implement batch image export ([3ad6ee6](https://github.com/sunpebble/quarry/commit/3ad6ee6fb46cdd814511a766aeeaeb9499f90c6c))
- resolve typecheck errors, lint warnings, and base-ui 1.1.0 compatibility ([9bf86fb](https://github.com/sunpebble/quarry/commit/9bf86fb91bfcc4120e9c3ea7eff891de10993f48))
- resolve virtual scroll blank areas by adding scrollMargin for sticky header ([f7f3087](https://github.com/sunpebble/quarry/commit/f7f3087b249c181de4de38d24e2b0e66c7acdf5b))
- **scroll-area:** apply tabIndex to viewport for proper focus handling ([47434ca](https://github.com/sunpebble/quarry/commit/47434cad58dd1fa067e3bb4e6a9087a182d5403a))
- security hardening, design migration cleanup, and code quality improvements ([62bef2a](https://github.com/sunpebble/quarry/commit/62bef2addb9635906008f22b264b5c096f934c6b))
- **security:** add SQL injection prevention for PRAGMA statements ([264351e](https://github.com/sunpebble/quarry/commit/264351e2930ed8cb621178ede8af79a522312386))
- **security:** apply pragma-escape to database service ([290e540](https://github.com/sunpebble/quarry/commit/290e540c771a81e85a7a80dbb8fedf6d8c3c449b))
- **security:** enable Electron sandbox mode ([7a77dce](https://github.com/sunpebble/quarry/commit/7a77dcede86bfc9426ec9f360b30bd4c2fd9755d))
- set Monaco dark theme when opening query editor for screenshots ([b1a6e60](https://github.com/sunpebble/quarry/commit/b1a6e6080dc43250ff9770573604989995c89269))
- set monaco theme immediately on mount ([4b067c0](https://github.com/sunpebble/quarry/commit/4b067c0a34fbc300f45d0e34878070f9f4f51dbe))
- **shortcuts:** correct data table selector for focus toggle ([23c0a31](https://github.com/sunpebble/quarry/commit/23c0a31a388178899f0edf19a895882c1fd1d8bb))
- **shortcuts:** improve Cmd+W and Cmd+N behavior ([61d6bd5](https://github.com/sunpebble/quarry/commit/61d6bd53a9ee4a711dd01a9bbb149c652dce7ef4))
- **storage:** add environment guards to persist functions ([e4ff2f1](https://github.com/sunpebble/quarry/commit/e4ff2f1d614c685695f0afa0292c05efd0af60f2))
- **styles:** reduce bg-grid-dot opacity and add glass-gold style ([6150b5a](https://github.com/sunpebble/quarry/commit/6150b5a2d965fa47d5b350c6a2dc79d15a2d4d3e))
- sync Monaco editor theme with app theme in screenshots ([49fad1a](https://github.com/sunpebble/quarry/commit/49fad1af314605a18a53df12d730842561522dcd))
- **table-view:** refocus data table when switching back from gallery view ([fce8037](https://github.com/sunpebble/quarry/commit/fce80374095cce741f3627a561a048cffd07ac87))
- **table:** fix pagination cache invalidation in useClientSearch ([2900602](https://github.com/sunpebble/quarry/commit/29006028dab2e26b4661e1ba37b48a524189af1a))
- **table:** prevent pagination flicker during page navigation ([01799cd](https://github.com/sunpebble/quarry/commit/01799cd42c3519c0133076860ee8915aeba82d45))
- **table:** subscribe to tabsByConnection state for proper reactivity ([48e1ff1](https://github.com/sunpebble/quarry/commit/48e1ff1b4964baf6172ceba34388f1140685986d))
- **table:** use Zustand selector for activeTab to fix pagination reactivity ([686b221](https://github.com/sunpebble/quarry/commit/686b221b0be5f457551b99cac81b64a608ec66c9))
- **tour:** correct Compare view tour step target selector ([83422c4](https://github.com/sunpebble/quarry/commit/83422c4e5c9de14a5ea11b33f855063b77cb1b1b))
- **ui:** add cursor-pointer style to table list items ([8d958ea](https://github.com/sunpebble/quarry/commit/8d958ea90d0b261be6aa5ebdfdb36ae0ba96f0a1))
- **ui:** add hover underline style to tour CTA button ([ea77e29](https://github.com/sunpebble/quarry/commit/ea77e29f9e84de336dd23818a92e4c8dcec8e524))
- **ui:** align borders and shadows with neobrutalism design system ([277ce40](https://github.com/sunpebble/quarry/commit/277ce4076e8164c02e11f38e224e9090f45074fa))
- **ui:** center welcome screen and website screenshots vertically ([43af900](https://github.com/sunpebble/quarry/commit/43af9001f75eebec35555f16343b9a47ff0647b7))
- **ui:** ensure cursor pointer styles apply with !important ([e709405](https://github.com/sunpebble/quarry/commit/e70940536f4402da51e1c28c58fae54e8597ddee))
- **ui:** final tab style unification pass ([5e01d82](https://github.com/sunpebble/quarry/commit/5e01d829d32b055b7d530731f59893711d71379e))
- **ui:** fix cursor styles for buttons, checkboxes, and interactive elements ([48acaba](https://github.com/sunpebble/quarry/commit/48acabaffac7c884a7efa98cadd59e5e45bfb05d))
- **ui:** make children of interactive elements inherit cursor ([c5addc3](https://github.com/sunpebble/quarry/commit/c5addc333ac5414668e56c08fd130a860007bb9e))
- **ui:** make entire tour CTA button clickable ([e71cf93](https://github.com/sunpebble/quarry/commit/e71cf93b1457642a33582cab22b728110cc9b2eb))
- **ui:** remove offset shadow from tab active states ([95f6db9](https://github.com/sunpebble/quarry/commit/95f6db9fd31672c76b1b3a64768afe489bf44ae1))
- **ui:** remove orphaned aria-invalid border class from input ([7b67d66](https://github.com/sunpebble/quarry/commit/7b67d6685d7f063c2cfdd77e6ef9ecb1abbd263c))
- **ui:** theme dropdown auto-width and remove duplicate tour button ([7c6bc87](https://github.com/sunpebble/quarry/commit/7c6bc87441358efa59c9b3052ea474481f83cf53))
- **ui:** unify all tab styles to consistent neobrutalism pattern ([5ab435a](https://github.com/sunpebble/quarry/commit/5ab435aac4ae85c6f0a7c999dc32c75b71f56097))
- **ui:** unify QueryView tab switcher with neobrutalism tab pattern ([397148a](https://github.com/sunpebble/quarry/commit/397148a1a9f39ef348863727372be86fbd9566f2))
- **vector-search:** integrate useVectorSearch hook and VectorVisualization component ([3db8fc1](https://github.com/sunpebble/quarry/commit/3db8fc1fde71e13b712c565bb1fc4b5a65f5fb7e))
- **vim:** ignore Command key modifier to avoid shortcut conflicts ([33ae007](https://github.com/sunpebble/quarry/commit/33ae007d4a4205de4a2576bc264984fa73a514b7))
- website carousel layout and screenshot capture ([f994968](https://github.com/sunpebble/quarry/commit/f9949684a53f0c4e92d8cdae4b1290d762c781da))
- **website:** fix download button shadow overflow on landing page ([7b11780](https://github.com/sunpebble/quarry/commit/7b117804ddf888faeba2709ee5ae96123fc22e0d))
- 修复字号和字体 CSS 变量默认值与 store 不一致的问题 ([0b3828c](https://github.com/sunpebble/quarry/commit/0b3828c21b6e986b9a33fd08ac590490fda03ee0))

### Performance Improvements

- batch turso adapter mutations ([#103](https://github.com/sunpebble/quarry/issues/103)) ([58316de](https://github.com/sunpebble/quarry/commit/58316de46f4cb6279eedd507f98c3375626f22bb))
- **build:** optimize electron-builder configuration ([78b40d1](https://github.com/sunpebble/quarry/commit/78b40d1aa9d9670ad462b0ad748cc9f615a99db5))
- **changes-store:** use Map index for O(1) row lookups ([8597d28](https://github.com/sunpebble/quarry/commit/8597d28dc94da60a0c39f9acd537f41a84cfb22c))
- **database:** add fast row count estimation for large tables ([8b09e81](https://github.com/sunpebble/quarry/commit/8b09e81fe0d1e6bf507ffadb08ea49699e73f23f))
- implement ghost resize for DataGrid column resizing ([128e5c8](https://github.com/sunpebble/quarry/commit/128e5c806188b5dd9a0b82db2ce295964b37df37))
- implement row virtualization for DataTable using @tanstack/react-virtual ([9a2e9bb](https://github.com/sunpebble/quarry/commit/9a2e9bbf838da1e4c95b9c3b597d071fe2e8d83b))
- optimize backup restore with streaming file read ([#104](https://github.com/sunpebble/quarry/issues/104)) ([424c5ba](https://github.com/sunpebble/quarry/commit/424c5baa7e74a54e4add95d20f4edb5ff6470e0a))
- optimize bundle size with direct imports and code splitting ([0e941ca](https://github.com/sunpebble/quarry/commit/0e941cadaa6a7c2d14b6d17463151a3e48e7b9ac))
- optimize DataTable scroll to eliminate blank flashes during fast scrolling ([dce5b50](https://github.com/sunpebble/quarry/commit/dce5b50d99ecad76b8fdf8208c44b6e45ac8a96b))
- Optimize Turso schema fetching with parallel requests ([#101](https://github.com/sunpebble/quarry/issues/101)) ([73a586a](https://github.com/sunpebble/quarry/commit/73a586a24fdafebfc3c820b81f350f97fa7dac94))
- **routes:** add lazy loading for route components ([17cdcd0](https://github.com/sunpebble/quarry/commit/17cdcd0ae0d115db5b651481d831cd0174dbf1b4))
- **search:** optimize useClientSearch with deferred value and caching ([aa21b66](https://github.com/sunpebble/quarry/commit/aa21b6642d0840c61bffdb9d271c5952fe28f0a0))
- virtualize DataTable rows with @tanstack/react-virtual ([a38fb95](https://github.com/sunpebble/quarry/commit/a38fb95fd19c7cedc99d8108060b9df660aaa34f))
- wrap restore backup loop in transaction ([#105](https://github.com/sunpebble/quarry/issues/105)) ([12e4137](https://github.com/sunpebble/quarry/commit/12e4137449bca43132d501382b155159f75bd03d))

### Reverts

- remove unstable virtual scrolling implementation ([b1802f0](https://github.com/sunpebble/quarry/commit/b1802f0a27f5c6a00ccd11b96a88178764096556))

## [1.14.0](https://github.com/sunpebble/quarry/compare/v1.13.0...v1.14.0) (2026-01-07)

### Features

- **activity-bar:** add VSCode-style Activity Bar for view navigation ([8026773](https://github.com/sunpebble/quarry/commit/8026773fc27d99d7e5f346d0d701275e3be83c04))

## [1.13.0](https://github.com/sunpebble/quarry/compare/v1.12.0...v1.13.0) (2026-01-07)

### Features

- change shortcut key for toggling schema details to 'i' and update documentation ([03a8bfa](https://github.com/sunpebble/quarry/commit/03a8bfacf69efea7939feeeb3831dbfe04c8f2e5))
- **data-tabs:** add selectedRowId to DataTab and update openTable method ([8b564be](https://github.com/sunpebble/quarry/commit/8b564beb118c65d8ec0dd1ebfdb8eb5e732dadab))
- **database-adapters:** add connection timeout and improve error messages for MySQL and PostgreSQL ([0a2b8f7](https://github.com/sunpebble/quarry/commit/0a2b8f76a7ace59f65d6a85bd6c6e92d238b6379))
- **DataTabBar:** integrate ScrollArea and ScrollBar for improved tab navigation ([0b497d8](https://github.com/sunpebble/quarry/commit/0b497d832ec70d3c16bc16565864e9d96d645400))
- **dialog:** add AboutDialog component and integrate with dialog store ([b84e03f](https://github.com/sunpebble/quarry/commit/b84e03fba250eee6bdb5db4f4c21d0f12b726ed0))
- **electron:** enhance application with new features, improve performance ([a55ae39](https://github.com/sunpebble/quarry/commit/a55ae39fed61e5753335fc0a7e9b2c9dd9672013))
- **file-watcher:** implement file watcher for database changes ([201cc3f](https://github.com/sunpebble/quarry/commit/201cc3f7b54ea3be608afa369eeb9e138eb012d9))
- **password:** implement password storage using Tauri store ([f03a95c](https://github.com/sunpebble/quarry/commit/f03a95cc5d9e66c64c0c33783086c68c06a14909))
- **selection-stats:** add Excel-like selection statistics component ([daafbfd](https://github.com/sunpebble/quarry/commit/daafbfd4d24c99b322b28dcdd482e15848840bce))
- **tauri:** initialize Tauri app with essential files and configurations ([8998e3c](https://github.com/sunpebble/quarry/commit/8998e3cb0168a79fd18b242d968959f047dff773))
- **WelcomeScreen:** prevent duplicate connections by switching to existing ones ([0a2b8f7](https://github.com/sunpebble/quarry/commit/0a2b8f76a7ace59f65d6a85bd6c6e92d238b6379))

### Bug Fixes

- **DatabaseView:** update tab styles for improved visual consistency ([9dced80](https://github.com/sunpebble/quarry/commit/9dced80a5da4b00bd3c31c5fcdecb6dfa51555fb))
- **DataTabBar:** adjust ScrollArea height for better tab layout ([7925642](https://github.com/sunpebble/quarry/commit/7925642031350f2b54834a88d99195e47b2ab751))
- **menu:** restrict developer tools access in production mode ([4d02325](https://github.com/sunpebble/quarry/commit/4d02325144d8932db7f6dc852ceae6e3e25f4e15))
- refactor setState in useEffect to render-time comparison pattern ([020cde9](https://github.com/sunpebble/quarry/commit/020cde92750f598b271eae5af2d1a2e779e79e4c))
- replace window.alert/confirm with proper dialog components ([4169b92](https://github.com/sunpebble/quarry/commit/4169b924f103d7900f79f63e7ada513e4a80770a))
- resolve react-hooks/exhaustive-deps violations in 5 files ([1acc3c2](https://github.com/sunpebble/quarry/commit/1acc3c2cb9ce483cd7ae32cd5acd8b369e51085a))
- use error message as stable key instead of array index in FieldError ([c16de44](https://github.com/sunpebble/quarry/commit/c16de44c9ff797cdfc010d159ea1ec36053a1c94))
- **WelcomeScreen:** handle existing connections before opening a new one ([82f1f87](https://github.com/sunpebble/quarry/commit/82f1f871a3f51445852d4359c1344671707325b2))

## [1.12.0](https://github.com/sunpebble/quarry/compare/v1.11.0...v1.12.0) (2026-01-06)

### Features

- implement keyboard shortcuts dialog and remove related settings ([ef92464](https://github.com/sunpebble/quarry/commit/ef92464fc26fd673e6cb804310b026a7021fd0a6))
- **onboarding:** implement welcome tour and dialog for user guidance ([9c0ddb5](https://github.com/sunpebble/quarry/commit/9c0ddb599b9826c2d559077cc0540f9deb13f751))
- **sidebar:** add empty state handling for database and filter results ([decec5c](https://github.com/sunpebble/quarry/commit/decec5ce79c619dfbd7fc09c92447fd1f0a7310c))

## [1.11.0](https://github.com/sunpebble/quarry/compare/v1.10.0...v1.11.0) (2026-01-06)

### Features

- add collapsible schema panel to DiffTable for better field visibility ([36e4076](https://github.com/sunpebble/quarry/commit/36e4076a1990c120104e0a1b89b9e4db2ead4d3c))
- add database type and connection config to connection profile in WelcomeScreen ([575f31c](https://github.com/sunpebble/quarry/commit/575f31c531bf13ea6e0959823901677411616e2d))
- add drag-and-drop support for database files in DatabaseView ([#40](https://github.com/sunpebble/quarry/issues/40)) ([70fba9b](https://github.com/sunpebble/quarry/commit/70fba9b36cc4b4eedc4d18d2f40ce9f129f2efd8))
- add error handling for schema loading and close probe connection ([8b1bb3d](https://github.com/sunpebble/quarry/commit/8b1bb3d11dc3cef7bb396e0956d81cfe383f3e94))
- add expand/collapse all functionality to Sidebar component ([124dbba](https://github.com/sunpebble/quarry/commit/124dbba2ab37bc7da0202d5ef002a79f142b23c2))
- add lock icon to indicate encrypted connections in ConnectionSwitcher ([57cab85](https://github.com/sunpebble/quarry/commit/57cab85b76aef3e14cfa30c3441be2afbf9a0a7b))
- add navigation shortcuts for data diff and update keyboard shortcut bindings ([957967f](https://github.com/sunpebble/quarry/commit/957967fb5d395fe078645619cb84f32b86e9d4f9))
- add showSchemaDetails state and toggle functionality for schema details panel ([d8b7ee1](https://github.com/sunpebble/quarry/commit/d8b7ee17c1ed5249686a868088352f26eb1fb054))
- add test connection functionality for various database adapters ([2c80dae](https://github.com/sunpebble/quarry/commit/2c80dae4b20421c73b1fbf2e0f705af3ba209427))
- add tooltip for encrypted connections in ConnectionSelector ([f297c67](https://github.com/sunpebble/quarry/commit/f297c678d61d8ad68ccfc8d2495f2e6689742273))
- change default expansion state for new schemas to expanded in Sidebar component ([f92dbe7](https://github.com/sunpebble/quarry/commit/f92dbe72bd4dd9ca209ae5042118e63021dded37))
- enhance drag-and-drop functionality with nested event handling ([ec1ac8d](https://github.com/sunpebble/quarry/commit/ec1ac8de9669961ce697e05d7b8dada306803bd0))
- enhance recent connection handling and edit functionality for server databases ([e156b3a](https://github.com/sunpebble/quarry/commit/e156b3ae895371e58707ed090d7a0926568db978))
- enhance SchemaImportDialog and error route with ScrollArea for improved UI experience ([3a7aaaf](https://github.com/sunpebble/quarry/commit/3a7aaaf3e6196c841b35d505f6379623127da8d4))
- implement change password functionality for database connections ([4ac4dc0](https://github.com/sunpebble/quarry/commit/4ac4dc06e0d0515772a007608319d7c12fd03065))
- implement drag selection for multi-row selection in DataTable ([ba30cc7](https://github.com/sunpebble/quarry/commit/ba30cc7afed290196b93c6bb2815cf52669c30bc))
- implement global dialog management and settings functionality ([f34f310](https://github.com/sunpebble/quarry/commit/f34f310c15e6dc00aade4ca5c30ed5cea1169968))
- improve empty state presentation in DataTable component ([0d86ea9](https://github.com/sunpebble/quarry/commit/0d86ea941ce02a59720cc15461cb28ac7a0766e8))
- integrate ScrollArea and ScrollBar for improved tab navigation ([ca1565a](https://github.com/sunpebble/quarry/commit/ca1565a6100bfa4c03e5ee55025a2410081900d4))
- **ipc:** add file write handler with atomic writes ([c44a724](https://github.com/sunpebble/quarry/commit/c44a724c20b93e224538ef37d88f157bff61a8d5))
- **onboarding:** enhance onboarding tour with new features and steps ([020a302](https://github.com/sunpebble/quarry/commit/020a302c3e149d87129b2cfe2962adfda9f52423))
- **onboarding:** implement onboarding tour with state management and persistence ([c1c8532](https://github.com/sunpebble/quarry/commit/c1c8532502c8971ffa346bf399680502770e444c))
- optimize count query by removing unnecessary ORDER BY clause in MySQL and PostgreSQL adapters ([fdc60c7](https://github.com/sunpebble/quarry/commit/fdc60c7849488cf0857affadeebb557aff952617))
- **preload:** add writeFile method to dialog namespace ([b7867c2](https://github.com/sunpebble/quarry/commit/b7867c2ade3c827a88516ddac2f55919af8e1ef6))
- refine keyboard shortcuts and toggle functionality for schema details in Data Browser view ([143bcef](https://github.com/sunpebble/quarry/commit/143bcef31c31aad6eebd79673837def66df73a03))
- remove baseUrl and paths from tsconfig for cleaner configuration ([a8ed377](https://github.com/sunpebble/quarry/commit/a8ed377e24d59e52e86967faa21a9024fad7c1af))
- **renderer:** replace clipboard fallback with file write API in DataDiffSQLGenerator ([7ef78e5](https://github.com/sunpebble/quarry/commit/7ef78e51f3cface24b25a3a2ddd924ff697d016b))
- replace Lock icon with KeyRound icon for encrypted connections in ConnectionSwitcher ([00267c6](https://github.com/sunpebble/quarry/commit/00267c69b46301b72348cb84216b73a862998ba1))
- **schema-comparison:** replace clipboard fallback with file write API ([69ab92a](https://github.com/sunpebble/quarry/commit/69ab92ade135d0410c9d8bba1e09f19c86572010))
- support composite primary keys in table row identification ([d33f4a0](https://github.com/sunpebble/quarry/commit/d33f4a0f5bb7a4aca104465a50b89da42c636370))

### Bug Fixes

- correct gzip magic number case sensitivity in compression checks ([2756a63](https://github.com/sunpebble/quarry/commit/2756a63317ece62be4c43fdde3d5dee645a72689))
- format JSON structure and add tableMetadata to Sidebar component ([3414253](https://github.com/sunpebble/quarry/commit/34142535c589030111430b10f3238f6dda78d384))
- format script_commands and package_managers for consistency ([d0d3a49](https://github.com/sunpebble/quarry/commit/d0d3a49e1016da41f64422355f9defbe8677f431))
- improve styling and layout in SchemaSection and TableItem components ([26624f5](https://github.com/sunpebble/quarry/commit/26624f5abbede00f2d3599172763d0dccaaa7ab4))
- remove specific auto-claude files from .gitignore ([604b0e5](https://github.com/sunpebble/quarry/commit/604b0e5b7a93dce3c4711b5388a01a2e5894a510))
- update titlebar component documentation for clarity ([04f60ca](https://github.com/sunpebble/quarry/commit/04f60ca323ac7cd9020cbc61687d985dd1a78a89))
- update toggle schema details shortcut key from '0' to '\' ([6acf5e1](https://github.com/sunpebble/quarry/commit/6acf5e122370300a8dda3938640184799565b4f9))

## [1.10.0](https://github.com/sunpebble/quarry/compare/v1.9.0...v1.10.0) (2026-01-04)

### Features

- **ci:** add CI workflow configuration and guidelines for Nx ([77bc5e9](https://github.com/sunpebble/quarry/commit/77bc5e99156a9ced734b1c6b4d1be93bb4d5ea00))
- **commands:** add shortcut for recent connections (Ctrl+R) ([feae1fd](https://github.com/sunpebble/quarry/commit/feae1fd06f20539cbcee29b1bb74bae33846b82d))
- **data-table:** pass isExpanded prop to GroupRow for re-rendering on state change ([18314f2](https://github.com/sunpebble/quarry/commit/18314f2ddce962aaf7f936db783876fc1b539b6d))
- **data-tabs:** enhance tab state management with pagination, sorting, grouping, and filters ([18314f2](https://github.com/sunpebble/quarry/commit/18314f2ddce962aaf7f936db783876fc1b539b6d))
- **nx-cloud:** setup nx cloud workspace ([#32](https://github.com/sunpebble/quarry/issues/32)) ([8d40bb5](https://github.com/sunpebble/quarry/commit/8d40bb5c7eeb6927bd4ee72dfc01e0a8b1ff1af9))
- **shortcuts:** improve connection switching shortcuts ([32d115e](https://github.com/sunpebble/quarry/commit/32d115e5ec4fe642b69236fc17f796ef063e9a98))
- **storage:** add logging for renderer state operations ([dc6b2de](https://github.com/sunpebble/quarry/commit/dc6b2de0e6ac455cde4b3b60ae6ce179cf480133))
- **storage:** implement centralized persistence and hydration for renderer state ([cae0041](https://github.com/sunpebble/quarry/commit/cae0041d30cc94954a7e34bc2cdc7464131a774c))
- watch SQLite files for external changes and auto-reload schema and table data ([#34](https://github.com/sunpebble/quarry/issues/34)) ([d317527](https://github.com/sunpebble/quarry/commit/d317527a001494a7a9e597efb58692df69f85a58))

### Bug Fixes

- **ci:** add auto-apply fixes for format, lint, test, and build in CI run ([32b0e26](https://github.com/sunpebble/quarry/commit/32b0e26d527e7ea89407f0a6c5fe80cb582d4e5e))
- **ci:** correct command to start CI run using npx ([426553e](https://github.com/sunpebble/quarry/commit/426553ecdc253e1e43c32357dd6bbc3c8f90965a))
- **ci:** update command to start CI run using pnpm dlx ([71cfdd7](https://github.com/sunpebble/quarry/commit/71cfdd757a38244c4eba71def250895644aac767))
- **entitlements:** remove unnecessary keys for macOS security entitlements ([28e1072](https://github.com/sunpebble/quarry/commit/28e107299cee9c7c00692b211318db6084339817))
- **password:** fix remember password not saving correctly ([a306f1b](https://github.com/sunpebble/quarry/commit/a306f1b91adaa130abbaad4e7727d4fa64eab683))
- **storage:** check electron environment dynamically at each operation ([edc94f4](https://github.com/sunpebble/quarry/commit/edc94f40abf5d20e14ecb84359cc73f3739542c0))
- **storage:** fix font settings not saving and missing sql-log handler ([71babac](https://github.com/sunpebble/quarry/commit/71babacb201ed43bfdde55b2130d46fca674ae97))
- **storage:** initialize electron storage before app render ([62a5109](https://github.com/sunpebble/quarry/commit/62a510991ddccbf8b4817fb63cd3a3a946fa5efe))

## [1.9.0](https://github.com/sunpebble/quarry/compare/v1.8.0...v1.9.0) (2026-01-03)

### Features

- add keyboard shortcuts for recent, next, and previous connections ([cb4bfa0](https://github.com/sunpebble/quarry/commit/cb4bfa0bf49be9f5f708e15cdbad5cdbb21a31c3))
- **connection-store:** implement unsaved changes tracking for connections ([8ba034e](https://github.com/sunpebble/quarry/commit/8ba034e9e0f1450b430f755897e2d0891bb3909c))
- **data-diff:** add data comparison summary and row difference cards ([4b3af88](https://github.com/sunpebble/quarry/commit/4b3af8858f2e3feab097da83fa477f8430bdb0ca))
- **ipc:** add handlers for retrieving recent connections and checking password availability ([285f698](https://github.com/sunpebble/quarry/commit/285f69819aba5322157d331e0b75409747a454a7))
- **ipc:** split into multiple modules ([38434ed](https://github.com/sunpebble/quarry/commit/38434ede0ddec19cefccd0a68b2bc3f59d6ebf17))
- **mock-api:** enhance mock mode detection and add new mock operations ([a1d092f](https://github.com/sunpebble/quarry/commit/a1d092fffb3f3bcd74b85e93bf9b2ccee9ae0e26))
- refactor QueryEditor and CollectionsList components ([2721c4b](https://github.com/sunpebble/quarry/commit/2721c4b47836f7850983213ed57d8e6ff0858799))
- **schema-comparison:** add API methods for schema comparison operations ([84d117b](https://github.com/sunpebble/quarry/commit/84d117bde4cf884592632844b4d9175969c1dcb0))
- **store:** enhance connection store with serialization for Maps and Sets ([38434ed](https://github.com/sunpebble/quarry/commit/38434ede0ddec19cefccd0a68b2bc3f59d6ebf17))

### Bug Fixes

- **data-diff:** improve layout and accessibility of comparison controls ([25ec5a2](https://github.com/sunpebble/quarry/commit/25ec5a2d16ccfbcbaa67353dab6987f71c850719))
- **schema-comparison:** improve className handling in SchemaComparisonPanel ([88c6f3c](https://github.com/sunpebble/quarry/commit/88c6f3c2213d0cbe938613333476a198506e8315))
- **vitest:** update alias configuration for Vitest ([8ba034e](https://github.com/sunpebble/quarry/commit/8ba034e9e0f1450b430f755897e2d0891bb3909c))

## [1.8.0](https://github.com/sunpebble/quarry/compare/v1.7.0...v1.8.0) (2026-01-02)

### Features

- add BulkEditDialog component and integrate with TableView for bulk editing of selected rows ([35900e7](https://github.com/sunpebble/quarry/commit/35900e7eb4662545acee8284a2e1f0cd4b7721b9))
- add customizable keyboard shortcuts and settings dialog ([4d8a652](https://github.com/sunpebble/quarry/commit/4d8a65233028417e68dae7c655742631747afc32))
- add grid color variables and subtle grid background styles ([c0cb1a1](https://github.com/sunpebble/quarry/commit/c0cb1a16effffc4af002c7c5be5a8074b0670517))
- add grid color variables and subtle grid background styles ([78eedd3](https://github.com/sunpebble/quarry/commit/78eedd3d4c49bb3d329868ea3eb3aea4213adf60))
- add recent connection handling to ConnectionSelector and related components ([c56f8ca](https://github.com/sunpebble/quarry/commit/c56f8ca8ec6ee59db3db6641aad1e30c585afdcd))
- add SchemaExportDialog component for schema sharing ([2bd1062](https://github.com/sunpebble/quarry/commit/2bd1062ec1282a600f61d9f6cb4ac1a4592de21b))
- add sidebar toggle functionality and integrate with settings store ([35a56d7](https://github.com/sunpebble/quarry/commit/35a56d7f4e4654c3e813c5e6142cd05fd7386396))
- add SqlHighlight component for syntax highlighting of SQL code ([5e7cb7c](https://github.com/sunpebble/quarry/commit/5e7cb7c4352335e249d10026fbfe6d06f9d78d99))
- **data-table:** add row virtualization for large datasets ([829c480](https://github.com/sunpebble/quarry/commit/829c480027ccced5fdb21cb8d4bcc5352c60d0a2))
- enhance drag and drop functionality in ConnectionTabBar ([20af8c9](https://github.com/sunpebble/quarry/commit/20af8c96a6ce9d6d0df680dcd6749ad4969a640b))
- enhance security with Content Security Policy in index.html ([d90c925](https://github.com/sunpebble/quarry/commit/d90c925fe5aff59f5e1f5870803ec1708fc424c2))
- enhance security with Content Security Policy in index.html ([b1426ae](https://github.com/sunpebble/quarry/commit/b1426aeb618ada34a13026c02af0bbecc50f1e53))
- enhance UI components with improved layouts and keyboard navigation ([ef68614](https://github.com/sunpebble/quarry/commit/ef686140b07dfa5f562bbd12e5cfac3ea479a343))
- enhance UI components with improved layouts and keyboard navigation ([a0866e0](https://github.com/sunpebble/quarry/commit/a0866e03694a072d8661d908ea3a5bbd3113c91b))
- implement table organization features with sorting and tagging capabilities ([2ad24ca](https://github.com/sunpebble/quarry/commit/2ad24ca30c8d398dc813a25baaff0788567fdb41))
- multiple sql query ([3c37801](https://github.com/sunpebble/quarry/commit/3c37801e27d13f0ae1d1048b1e6b869f47f3e59a))
- multiple sql query results ([0d6735e](https://github.com/sunpebble/quarry/commit/0d6735ea176a4ff2ed4a2baadad4549fa11737e2))
- **pagination:** add quick page jump input ([46a90e9](https://github.com/sunpebble/quarry/commit/46a90e97f6c2698cb80266bb07569a1c050e248c))
- pro feature gates ([f10fe26](https://github.com/sunpebble/quarry/commit/f10fe2631115c67889adb75c099477a9f72a1c53))
- refactor database connection handling and improve error management ([89b14ba](https://github.com/sunpebble/quarry/commit/89b14ba1f01e76f56d23a250b9837a2d298e43b9))
- refactor UI components for improved consistency and performance ([2901cdd](https://github.com/sunpebble/quarry/commit/2901cdd7300f5082b35b063cab4dbb6ae7af5ad4))
- refactor UI components for improved layout and functionality ([6f4e68e](https://github.com/sunpebble/quarry/commit/6f4e68ee38575a49b2f9482005f9e4437cadbf4b))
- replace static kbd elements with ShortcutKbd component for dynamic shortcut display ([f36736f](https://github.com/sunpebble/quarry/commit/f36736fe4557999303d479ce43daa5d16154bb12))
- show recent connections in connection selector dropdown ([8f9ef76](https://github.com/sunpebble/quarry/commit/8f9ef76028b28faf201c9928b825ab3be6bc224e))
- **sidebar:** add table context menu with operations ([fb125e9](https://github.com/sunpebble/quarry/commit/fb125e9971d5ac3548c8bd94f94f90e31447f237))
- **sidebar:** switch to SQL Query tab and add confirmation dialogs ([d1fdb30](https://github.com/sunpebble/quarry/commit/d1fdb30793022d2b00df6285217cbec254fdcbb9))
- **sql-log:** add SQL log panel and logging functionality ([af82455](https://github.com/sunpebble/quarry/commit/af82455e5b9e85e39e3ce82c59e5a24a75ed9ca9))
- **sql-log:** add SQL log panel and logging functionality ([6e63e66](https://github.com/sunpebble/quarry/commit/6e63e66efc05e50fe0061351246922ab786055ec))
- **ui:** add creative table view enhancements ([d81b1b9](https://github.com/sunpebble/quarry/commit/d81b1b994eb7a12fafe1cb03811d11f6daf60804))
- **ui:** add creative table view enhancements ([a68be01](https://github.com/sunpebble/quarry/commit/a68be0101cfef65308cd3be4e6465c6173c4df1f))

### Bug Fixes

- add groupCount prop to HeaderCell for accurate grouping display ([897a97c](https://github.com/sunpebble/quarry/commit/897a97cd7f4c14a392209bbd48107b0580faf54e))
- adjust selection column width for better alignment and consistency ([c824dbc](https://github.com/sunpebble/quarry/commit/c824dbccde78fb7a59341dbb7a3a65f2e10e301d))
- ai settings ([291f8a7](https://github.com/sunpebble/quarry/commit/291f8a7db30f389c0994185277b63c08126a5d26))
- **connection-selector:** apply table font settings ([f288b83](https://github.com/sunpebble/quarry/commit/f288b83885fdd7f6350552d2bad40c40a3e03349))
- **connection-selector:** dropdown width matches trigger width ([41cce77](https://github.com/sunpebble/quarry/commit/41cce7764e7ab9072cae90431dcd32e840556583))
- correct CATEGORY_LABELS to FONT_CATEGORY_LABELS reference ([90cdb8c](https://github.com/sunpebble/quarry/commit/90cdb8c5d14f2f771f3871c2014ab45a17e83cfd))
- correct class names for improved styling in SqlLogPanel, Toolbar, Select, and Tabs components ([f7bcaa1](https://github.com/sunpebble/quarry/commit/f7bcaa14b5e2d6757181653d868835ac69486978))
- **data-table:** adjust row height and improve virtualization handling ([99b5960](https://github.com/sunpebble/quarry/commit/99b59600128140306cfdcf2d5d12f5cf9f87da0f))
- enhance dropdown menu item styling for better readability ([36b1882](https://github.com/sunpebble/quarry/commit/36b188204cfd815273663ad54beeb21e5b6095f1))
- ensure hooks return undefined for consistency in various components ([e767f2c](https://github.com/sunpebble/quarry/commit/e767f2cabb5642589bee55a4cd73df5c602a281c))
- ensure watch mode is disabled in vitest configuration ([9045a3f](https://github.com/sunpebble/quarry/commit/9045a3f2d9a533b555438bdaf7847303b14fd541))
- **er-diagram:** ensure handles are always rendered for edge connections ([274d523](https://github.com/sunpebble/quarry/commit/274d5238e326ececf97eac9058ed655d1eacf491))
- **er-diagram:** fix edge stroke color CSS variable format ([3cee083](https://github.com/sunpebble/quarry/commit/3cee08351c787190956f0a4bab4131958705b871))
- **er-diagram:** fix Handle positioning for proper edge connections ([1aa5f4b](https://github.com/sunpebble/quarry/commit/1aa5f4bba52dbf8336d81a93f4982d34fcf9c935))
- fetch system font timeout ([290d029](https://github.com/sunpebble/quarry/commit/290d0291bd9b39f60b6121d1c1aa67bbfa7b72bb))
- pagination ([67fc04d](https://github.com/sunpebble/quarry/commit/67fc04d9475f05df8e01a90bb57f1d7f2f46e72a))
- persist search term per table tab ([9356c8e](https://github.com/sunpebble/quarry/commit/9356c8e4d079e3231414aeec9252108fd847a56a))
- preset selector dropdown text truncation ([833c445](https://github.com/sunpebble/quarry/commit/833c4453611ce85eef1015fc6cbf69bd2396f082))
- refactor CollapsibleTrigger to use render prop for better flexibility ([0739c6e](https://github.com/sunpebble/quarry/commit/0739c6eea769f4712b4b747e4142eac6d46aa434))
- remove background from line variant tabs on active state ([c709c9e](https://github.com/sunpebble/quarry/commit/c709c9e42ecf004776aaaadd26d78893dcb6b3a6))
- resolve typecheck errors in font optimization and new components ([aa63e4f](https://github.com/sunpebble/quarry/commit/aa63e4f5747f1829d8dbef3f1e641f1b9bd51093))
- scroll-area ([0bfb0aa](https://github.com/sunpebble/quarry/commit/0bfb0aa32e3d17cc41018a04e282795650f49e23))
- shortcutKbd now re-renders when preset changes ([087c75d](https://github.com/sunpebble/quarry/commit/087c75dd34b6926b0dee3f97f842e2639f0f8a9a))
- **ui:** add CSS rules for font size inheritance ([93c25e2](https://github.com/sunpebble/quarry/commit/93c25e2279bfda76fda3dcd6e0f34892a476a248))
- **ui:** add nativeButton prop to all Base UI trigger components ([24f4194](https://github.com/sunpebble/quarry/commit/24f419430871f314d7e1676680828431b644fd80))
- **ui:** remove nativeButton from unsupported trigger components ([6e765d8](https://github.com/sunpebble/quarry/commit/6e765d8e9ba150a875741f697ca368c2355c793b))
- **ui:** wrap GroupLabel in Group for context in context and dropdown menus ([707a44a](https://github.com/sunpebble/quarry/commit/707a44a46a7f4407bfb2fe4236cad5c294b8b2fe))
- update folder selection handling and improve placeholder display ([12f0622](https://github.com/sunpebble/quarry/commit/12f06221a93ba2c10f692c3b289284f4b8dd1a47))
- update import paths and improve component properties for better functionality ([96add90](https://github.com/sunpebble/quarry/commit/96add9059727005484b6cc473c6f20831f187e2e))
- update max-width classes for better responsiveness in data table components ([f244ee7](https://github.com/sunpebble/quarry/commit/f244ee73268cda439938f2715307a16b429fb0f0))
- update max-width classes for better responsiveness in data table components ([c4b20a7](https://github.com/sunpebble/quarry/commit/c4b20a7a6f44c25e2a6d1f2476a57fb559f3a9d5))
- update SQL formatting shortcut for macOS to use Option/Alt key ([49f9d80](https://github.com/sunpebble/quarry/commit/49f9d80854977bb0c8056777843281d2854cc08f))
- use onClick instead of onSelect for DropdownMenuItem ([bbe1bcb](https://github.com/sunpebble/quarry/commit/bbe1bcbe540f190a5feeaafc101bdfa5cbfaf6ba))

## [1.7.0](https://github.com/sunpebble/quarry/compare/v1.6.0...v1.7.0) (2025-12-31)

### Features

- add Claude Code path support for Anthropic provider ([de7b3f3](https://github.com/sunpebble/quarry/commit/de7b3f3885364f5cd365ce80c58249faf6e6a3e5))
- auto updater ([9280a68](https://github.com/sunpebble/quarry/commit/9280a682b5b00ae0f8850c6f7ab9e6e8499ca242))
- electron-builder identity ([433fcf4](https://github.com/sunpebble/quarry/commit/433fcf4734bf24c981d125b1a987d12593886709))
- enhance column resizing functionality and improve layout handling ([b2acff1](https://github.com/sunpebble/quarry/commit/b2acff185c82b1e789ede51b1131a82938962430))
- error handling ([a3e1194](https://github.com/sunpebble/quarry/commit/a3e11944b38bb297b2b303a91fe932f22329369c))
- export ([dc7c909](https://github.com/sunpebble/quarry/commit/dc7c9090824b1b223fd704e962baf4b8d11483f3))
- integrate table font settings ([a342a41](https://github.com/sunpebble/quarry/commit/a342a41c490dd5693886274e365167fa14a6f0d3))
- multiple connections ([0bf08fa](https://github.com/sunpebble/quarry/commit/0bf08fa4f7461689dab092f5ba1f98aedf2697a6))
- multiple tabs support ([ed71fb6](https://github.com/sunpebble/quarry/commit/ed71fb6f0d2d926e18444a086479e9ca47bce0bd))
- optimize data table layout ([1012a43](https://github.com/sunpebble/quarry/commit/1012a43ec2c5c6faa235530c98704575cc60d7f2))
- plugin-sdk ([5882a81](https://github.com/sunpebble/quarry/commit/5882a81655b369013707137e5a5809e0477268fe))
- refactor CommandPalette with shadcn ([a65b4f9](https://github.com/sunpebble/quarry/commit/a65b4f991dce7e0dbef366cecb8b969684134c1e))
- replace AISettingsDialog with SettingsDialog ([9cb4c7e](https://github.com/sunpebble/quarry/commit/9cb4c7e72c0edfcff3fa496053c77f8614298314))
- update ai-powered features ([d5642a6](https://github.com/sunpebble/quarry/commit/d5642a68cdde3045503d2aafdc4b2d99e902e874))
- update electron-builder configurations ([c95ea70](https://github.com/sunpebble/quarry/commit/c95ea70c038d677c3a622ffa3f397e3f4283ee00))

### Bug Fixes

- build ([abb7e52](https://github.com/sunpebble/quarry/commit/abb7e527607d2f2c06dca9fa5631a0b06afe6d18))
- lint ([2fbcc26](https://github.com/sunpebble/quarry/commit/2fbcc26b48679f09cc08ecc1b96d4261c4b2fef8))
- multi-tab table view ([a7389e1](https://github.com/sunpebble/quarry/commit/a7389e19604a43d6c4236e66727e0739dcfb7f50))
- open connection settings dialog z-index ([0bcc8d1](https://github.com/sunpebble/quarry/commit/0bcc8d1b515cc4c550b668d277ce76535e02522d))
- remove unnecessary class from rowCount ([6d20d38](https://github.com/sunpebble/quarry/commit/6d20d3801c0f355d731927601985cfb6dd30bf81))
- sql editor and history ([01d8132](https://github.com/sunpebble/quarry/commit/01d8132bb3d12687dcd3220c483d061c593e4745))
- system fonts ([681beea](https://github.com/sunpebble/quarry/commit/681beea16fcedae405221010d99d7445e5bfe90e))
- update kbd component styles to use text-muted-foreground for better visibility ([4e0518c](https://github.com/sunpebble/quarry/commit/4e0518c2bd4279626e18950d0eef0023d87075b0))

## [1.6.0](https://github.com/sunpebble/quarry/compare/v1.5.0...v1.6.0) (2025-12-29)

### Features

- update pnpm-workspace.yaml ([90bea2f](https://github.com/sunpebble/quarry/commit/90bea2fa4801c5fe78caf7ec21497eedc40111e6))

## [1.5.0](https://github.com/sunpebble/quarry/compare/v1.4.0...v1.5.0) (2025-12-29)

### Features

- ER Diagram auto layout ([88ada1b](https://github.com/sunpebble/quarry/commit/88ada1be8def5f5c00451b2bb56f6a56a06d1552))

### Bug Fixes

- command palette ([1867efa](https://github.com/sunpebble/quarry/commit/1867efab4fcfa02f530b5119c0c970efa2b9957d))

## [1.4.0](https://github.com/sunpebble/quarry/compare/v1.3.0...v1.4.0) (2025-12-29)

### Features

- add @radix-ui/react-label dependency and update related components ([ef50abc](https://github.com/sunpebble/quarry/commit/ef50abcd3e6c903e0ba367c05d6705ea8433f576))
- add initial .auto-claude-status file and update .claude_settings.json ([88cd6c2](https://github.com/sunpebble/quarry/commit/88cd6c214124ca4f12ce5672bdd056daa5e8489b))
- add platform-specific app icon handling and improve dock icon on macOS ([9fdbddf](https://github.com/sunpebble/quarry/commit/9fdbddf8bc9f6c9c60eabfd958eea9ba51afc5e5))
- add schema support to various components and mock API ([c05ee5f](https://github.com/sunpebble/quarry/commit/c05ee5f6c16b7f190dad53b727fff0c089ee53f3))
- ai-powered features ([b0e5236](https://github.com/sunpebble/quarry/commit/b0e5236063b2de64b7c31cc3e8ef5dc3a89d1bae))
- ai-powered features ([7609f2a](https://github.com/sunpebble/quarry/commit/7609f2a544ce4f5e035c2e454e65fb86cf849649))
- analyze ([98aabfa](https://github.com/sunpebble/quarry/commit/98aabfae9e4a183b123a7c33dc1079c77330067b))
- docs ([c2d952f](https://github.com/sunpebble/quarry/commit/c2d952ff0ae90a7fbdf800b6b0824afaa26c7d72))
- enhance font loading with fallback options and update connection settings handling ([e015d30](https://github.com/sunpebble/quarry/commit/e015d3053ac923357c08772240ff805e69bd18a5))
- enhance schema handling in sidebar and table views ([bb06f29](https://github.com/sunpebble/quarry/commit/bb06f293b2dc99505236bc396f36b83bb9aea580))
- enhance UI components with improved styling and layout adjustments ([1e78aa5](https://github.com/sunpebble/quarry/commit/1e78aa586e47ca82dba55432be9d6d0ef2fbc18e))
- erdiagram ([82e5dd0](https://github.com/sunpebble/quarry/commit/82e5dd05410231cd3b9aa54224fcadb38e8b91ed))
- **history:** add Clear All button with confirmation dialog ([398bed2](https://github.com/sunpebble/quarry/commit/398bed2fb4deb65e416c02fe349140d67cd8d475))
- **history:** display execution duration with formatDuration helper ([338dcbc](https://github.com/sunpebble/quarry/commit/338dcbc9d974b64a53b89c6848d3ac32a42f7fd1))
- split pane ([9d3ac11](https://github.com/sunpebble/quarry/commit/9d3ac11ab4eed5ec8b71d9db8e13c38954a201f7))
- **ui:** add Popover component for filter dropdowns ([26dd959](https://github.com/sunpebble/quarry/commit/26dd959f6f6bf654d8e968e143046315212c8859))
- **ui:** add Select component for filter operator dropdowns ([c5d0858](https://github.com/sunpebble/quarry/commit/c5d0858788b24bb7a3ad43dff1c60cc17d194c28))
- update .gitignore to include .worktrees and adjust .claude-flow entry ([ad7d4f2](https://github.com/sunpebble/quarry/commit/ad7d4f2de7b949b15f0ed6b30ecb8def680eb17f))
- update pnpm workspace configuration and enhance UI components ([01899b1](https://github.com/sunpebble/quarry/commit/01899b1afae9ecee04a0c260367b8722d9ab4cb1))
- update TailwindCSS styles ([e22facd](https://github.com/sunpebble/quarry/commit/e22facd957d15c1fee6cc4e17bfb755dfd52d23f))
- update UI components with grid background styles and improve layout ([5c26fc2](https://github.com/sunpebble/quarry/commit/5c26fc23bbf002548bc70ad7d290983a9af8c987))

### Bug Fixes

- add h-0 class to QueryResults container to fix scrolling ([b9a896b](https://github.com/sunpebble/quarry/commit/b9a896bdd54dfaf7dd428a8331004176e6158e4b))
- add missing newline at end of .claude_settings.json ([f193466](https://github.com/sunpebble/quarry/commit/f1934662fdfe3c30de98a4de0acd20f54afba3c0))
- **docs:** correct broken anchor link in shortcuts.md ([eb3032f](https://github.com/sunpebble/quarry/commit/eb3032f37f74cdcf5558a94b0bbcd56a0fb5569f))
- improve layout and scrolling behavior ([ef14049](https://github.com/sunpebble/quarry/commit/ef14049f495a97c349997b280b2e86dfb25f08cd))

## [1.3.0](https://github.com/sunpebble/quarry/compare/v1.2.0...v1.3.0) (2025-12-27)

### Features

- add Vim key navigation support and command palette ([4de0c99](https://github.com/sunpebble/quarry/commit/4de0c993b26387ba4d34b62fd6ece42fa928b73e))

## [1.2.0](https://github.com/sunpebble/quarry/compare/v1.1.1...v1.2.0) (2025-12-26)

### Features

- add GitHub release configuration to electron-builder ([3fcdcd6](https://github.com/sunpebble/quarry/commit/3fcdcd6c9a3213ff36de0a18adfcb521e66339bb))

## [1.1.1](https://github.com/sunpebble/quarry/compare/v1.1.0...v1.1.1) (2025-12-26)

### Bug Fixes

- update Node.js version handling in release workflow ([a494209](https://github.com/sunpebble/quarry/commit/a494209bee6c3eafb0b550cae6f8dd4af2c1ad2a))

## [1.1.0](https://github.com/sunpebble/quarry/compare/v1.0.0...v1.1.0) (2025-12-26)

### Features

- integrate mock API for development and testing ([a97fd89](https://github.com/sunpebble/quarry/commit/a97fd89706d47da9da8effe4adecc3dc0b417b27))

## 1.0.0 (2025-12-26)

### Features

- add ConnectionSettingsDialog component for managing connection settings ([b307b95](https://github.com/sunpebble/quarry/commit/b307b95c9162d5303bd35325fe8013102a35dd55))
- add Dependabot configuration and GitHub Actions workflow for automated releases ([6581d8d](https://github.com/sunpebble/quarry/commit/6581d8dfbf90e0959116f9e5d849a661310f31b3))
- add electron-builder configuration and icon generation scripts ([8b3f6e7](https://github.com/sunpebble/quarry/commit/8b3f6e71e0a83abc7d3debb2d973bd9cbae964c2))
- add global types for ElectronAPI and QuarryAPI in preload and renderer ([26d4850](https://github.com/sunpebble/quarry/commit/26d4850e99bdf7c2e17fb5c320bc04a9861ede59))
- add hash history for Electron compatibility in router ([8ad7b7a](https://github.com/sunpebble/quarry/commit/8ad7b7a907cb2f095b2af34f74fe3786341e18dc))
- add Monaco SQL editor with autocomplete and theme support ([29aa6f4](https://github.com/sunpebble/quarry/commit/29aa6f4bd2cfc26f44ea630eede354aa2da5bc70))
- add undo functionality and keyboard navigation to Editable components ([c204fb3](https://github.com/sunpebble/quarry/commit/c204fb3299879022bdc6aaf8eaca919dc83a04a1))
- add WelcomeScreen component and related UI elements ([dcafc53](https://github.com/sunpebble/quarry/commit/dcafc53a9e2585f8638510baec4eee16d8e40dcd))
- **data-table:** implement editable table with virtual scrolling and resizable columns ([9e16133](https://github.com/sunpebble/quarry/commit/9e16133ef3b8e862458fda14a5d2a2ce0522878c))
- enhance data handling with reload trigger and improved change management ([465707d](https://github.com/sunpebble/quarry/commit/465707dd0c0e274ff839abe728291bc63feacfe1))
- enhance password management with storage options and UI updates ([b03f862](https://github.com/sunpebble/quarry/commit/b03f862cc90e07017cfbcae3241f38f4d8d1233e))
- implement resizable panels and theme toggle functionality ([41f6f2b](https://github.com/sunpebble/quarry/commit/41f6f2bccb4292407afa65f551680088d4c6b5d1))
- integrate Tailwind CSS with Vite and remove PostCSS configuration ([99baa8a](https://github.com/sunpebble/quarry/commit/99baa8a9b25fe6567c1e54c5195a37239014a857))

### Bug Fixes

- reorder scripts in package.json for better organization ([e6b72e0](https://github.com/sunpebble/quarry/commit/e6b72e021b13521b37f0b706ff13e87909b21cd7))
