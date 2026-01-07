# Changelog

## [1.13.0](https://github.com/kunish-homelab/sql-pro/compare/v1.12.0...v1.13.0) (2026-01-07)


### Features

* change shortcut key for toggling schema details to 'i' and update documentation ([03a8bfa](https://github.com/kunish-homelab/sql-pro/commit/03a8bfacf69efea7939feeeb3831dbfe04c8f2e5))
* **data-tabs:** add selectedRowId to DataTab and update openTable method ([8b564be](https://github.com/kunish-homelab/sql-pro/commit/8b564beb118c65d8ec0dd1ebfdb8eb5e732dadab))
* **database-adapters:** add connection timeout and improve error messages for MySQL and PostgreSQL ([0a2b8f7](https://github.com/kunish-homelab/sql-pro/commit/0a2b8f76a7ace59f65d6a85bd6c6e92d238b6379))
* **DataTabBar:** integrate ScrollArea and ScrollBar for improved tab navigation ([0b497d8](https://github.com/kunish-homelab/sql-pro/commit/0b497d832ec70d3c16bc16565864e9d96d645400))
* **dialog:** add AboutDialog component and integrate with dialog store ([b84e03f](https://github.com/kunish-homelab/sql-pro/commit/b84e03fba250eee6bdb5db4f4c21d0f12b726ed0))
* **electron:** enhance application with new features, improve performance ([a55ae39](https://github.com/kunish-homelab/sql-pro/commit/a55ae39fed61e5753335fc0a7e9b2c9dd9672013))
* **file-watcher:** implement file watcher for database changes ([201cc3f](https://github.com/kunish-homelab/sql-pro/commit/201cc3f7b54ea3be608afa369eeb9e138eb012d9))
* **password:** implement password storage using Tauri store ([f03a95c](https://github.com/kunish-homelab/sql-pro/commit/f03a95cc5d9e66c64c0c33783086c68c06a14909))
* **selection-stats:** add Excel-like selection statistics component ([daafbfd](https://github.com/kunish-homelab/sql-pro/commit/daafbfd4d24c99b322b28dcdd482e15848840bce))
* **tauri:** initialize Tauri app with essential files and configurations ([8998e3c](https://github.com/kunish-homelab/sql-pro/commit/8998e3cb0168a79fd18b242d968959f047dff773))
* **WelcomeScreen:** prevent duplicate connections by switching to existing ones ([0a2b8f7](https://github.com/kunish-homelab/sql-pro/commit/0a2b8f76a7ace59f65d6a85bd6c6e92d238b6379))


### Bug Fixes

* **DatabaseView:** update tab styles for improved visual consistency ([9dced80](https://github.com/kunish-homelab/sql-pro/commit/9dced80a5da4b00bd3c31c5fcdecb6dfa51555fb))
* **DataTabBar:** adjust ScrollArea height for better tab layout ([7925642](https://github.com/kunish-homelab/sql-pro/commit/7925642031350f2b54834a88d99195e47b2ab751))
* **menu:** restrict developer tools access in production mode ([4d02325](https://github.com/kunish-homelab/sql-pro/commit/4d02325144d8932db7f6dc852ceae6e3e25f4e15))
* refactor setState in useEffect to render-time comparison pattern ([020cde9](https://github.com/kunish-homelab/sql-pro/commit/020cde92750f598b271eae5af2d1a2e779e79e4c))
* replace window.alert/confirm with proper dialog components ([4169b92](https://github.com/kunish-homelab/sql-pro/commit/4169b924f103d7900f79f63e7ada513e4a80770a))
* resolve react-hooks/exhaustive-deps violations in 5 files ([1acc3c2](https://github.com/kunish-homelab/sql-pro/commit/1acc3c2cb9ce483cd7ae32cd5acd8b369e51085a))
* use error message as stable key instead of array index in FieldError ([c16de44](https://github.com/kunish-homelab/sql-pro/commit/c16de44c9ff797cdfc010d159ea1ec36053a1c94))
* **WelcomeScreen:** handle existing connections before opening a new one ([82f1f87](https://github.com/kunish-homelab/sql-pro/commit/82f1f871a3f51445852d4359c1344671707325b2))

## [1.12.0](https://github.com/kunish-homelab/sql-pro/compare/v1.11.0...v1.12.0) (2026-01-06)


### Features

* implement keyboard shortcuts dialog and remove related settings ([ef92464](https://github.com/kunish-homelab/sql-pro/commit/ef92464fc26fd673e6cb804310b026a7021fd0a6))
* **onboarding:** implement welcome tour and dialog for user guidance ([9c0ddb5](https://github.com/kunish-homelab/sql-pro/commit/9c0ddb599b9826c2d559077cc0540f9deb13f751))
* **sidebar:** add empty state handling for database and filter results ([decec5c](https://github.com/kunish-homelab/sql-pro/commit/decec5ce79c619dfbd7fc09c92447fd1f0a7310c))

## [1.11.0](https://github.com/kunish-homelab/sql-pro/compare/v1.10.0...v1.11.0) (2026-01-06)


### Features

* add collapsible schema panel to DiffTable for better field visibility ([36e4076](https://github.com/kunish-homelab/sql-pro/commit/36e4076a1990c120104e0a1b89b9e4db2ead4d3c))
* add database type and connection config to connection profile in WelcomeScreen ([575f31c](https://github.com/kunish-homelab/sql-pro/commit/575f31c531bf13ea6e0959823901677411616e2d))
* add drag-and-drop support for database files in DatabaseView ([#40](https://github.com/kunish-homelab/sql-pro/issues/40)) ([70fba9b](https://github.com/kunish-homelab/sql-pro/commit/70fba9b36cc4b4eedc4d18d2f40ce9f129f2efd8))
* add error handling for schema loading and close probe connection ([8b1bb3d](https://github.com/kunish-homelab/sql-pro/commit/8b1bb3d11dc3cef7bb396e0956d81cfe383f3e94))
* add expand/collapse all functionality to Sidebar component ([124dbba](https://github.com/kunish-homelab/sql-pro/commit/124dbba2ab37bc7da0202d5ef002a79f142b23c2))
* add lock icon to indicate encrypted connections in ConnectionSwitcher ([57cab85](https://github.com/kunish-homelab/sql-pro/commit/57cab85b76aef3e14cfa30c3441be2afbf9a0a7b))
* add navigation shortcuts for data diff and update keyboard shortcut bindings ([957967f](https://github.com/kunish-homelab/sql-pro/commit/957967fb5d395fe078645619cb84f32b86e9d4f9))
* add showSchemaDetails state and toggle functionality for schema details panel ([d8b7ee1](https://github.com/kunish-homelab/sql-pro/commit/d8b7ee17c1ed5249686a868088352f26eb1fb054))
* add test connection functionality for various database adapters ([2c80dae](https://github.com/kunish-homelab/sql-pro/commit/2c80dae4b20421c73b1fbf2e0f705af3ba209427))
* add tooltip for encrypted connections in ConnectionSelector ([f297c67](https://github.com/kunish-homelab/sql-pro/commit/f297c678d61d8ad68ccfc8d2495f2e6689742273))
* change default expansion state for new schemas to expanded in Sidebar component ([f92dbe7](https://github.com/kunish-homelab/sql-pro/commit/f92dbe72bd4dd9ca209ae5042118e63021dded37))
* enhance drag-and-drop functionality with nested event handling ([ec1ac8d](https://github.com/kunish-homelab/sql-pro/commit/ec1ac8de9669961ce697e05d7b8dada306803bd0))
* enhance recent connection handling and edit functionality for server databases ([e156b3a](https://github.com/kunish-homelab/sql-pro/commit/e156b3ae895371e58707ed090d7a0926568db978))
* enhance SchemaImportDialog and error route with ScrollArea for improved UI experience ([3a7aaaf](https://github.com/kunish-homelab/sql-pro/commit/3a7aaaf3e6196c841b35d505f6379623127da8d4))
* implement change password functionality for database connections ([4ac4dc0](https://github.com/kunish-homelab/sql-pro/commit/4ac4dc06e0d0515772a007608319d7c12fd03065))
* implement drag selection for multi-row selection in DataTable ([ba30cc7](https://github.com/kunish-homelab/sql-pro/commit/ba30cc7afed290196b93c6bb2815cf52669c30bc))
* implement global dialog management and settings functionality ([f34f310](https://github.com/kunish-homelab/sql-pro/commit/f34f310c15e6dc00aade4ca5c30ed5cea1169968))
* improve empty state presentation in DataTable component ([0d86ea9](https://github.com/kunish-homelab/sql-pro/commit/0d86ea941ce02a59720cc15461cb28ac7a0766e8))
* integrate ScrollArea and ScrollBar for improved tab navigation ([ca1565a](https://github.com/kunish-homelab/sql-pro/commit/ca1565a6100bfa4c03e5ee55025a2410081900d4))
* **ipc:** add file write handler with atomic writes ([c44a724](https://github.com/kunish-homelab/sql-pro/commit/c44a724c20b93e224538ef37d88f157bff61a8d5))
* **onboarding:** enhance onboarding tour with new features and steps ([020a302](https://github.com/kunish-homelab/sql-pro/commit/020a302c3e149d87129b2cfe2962adfda9f52423))
* **onboarding:** implement onboarding tour with state management and persistence ([c1c8532](https://github.com/kunish-homelab/sql-pro/commit/c1c8532502c8971ffa346bf399680502770e444c))
* optimize count query by removing unnecessary ORDER BY clause in MySQL and PostgreSQL adapters ([fdc60c7](https://github.com/kunish-homelab/sql-pro/commit/fdc60c7849488cf0857affadeebb557aff952617))
* **preload:** add writeFile method to dialog namespace ([b7867c2](https://github.com/kunish-homelab/sql-pro/commit/b7867c2ade3c827a88516ddac2f55919af8e1ef6))
* refine keyboard shortcuts and toggle functionality for schema details in Data Browser view ([143bcef](https://github.com/kunish-homelab/sql-pro/commit/143bcef31c31aad6eebd79673837def66df73a03))
* remove baseUrl and paths from tsconfig for cleaner configuration ([a8ed377](https://github.com/kunish-homelab/sql-pro/commit/a8ed377e24d59e52e86967faa21a9024fad7c1af))
* **renderer:** replace clipboard fallback with file write API in DataDiffSQLGenerator ([7ef78e5](https://github.com/kunish-homelab/sql-pro/commit/7ef78e51f3cface24b25a3a2ddd924ff697d016b))
* replace Lock icon with KeyRound icon for encrypted connections in ConnectionSwitcher ([00267c6](https://github.com/kunish-homelab/sql-pro/commit/00267c69b46301b72348cb84216b73a862998ba1))
* **schema-comparison:** replace clipboard fallback with file write API ([69ab92a](https://github.com/kunish-homelab/sql-pro/commit/69ab92ade135d0410c9d8bba1e09f19c86572010))
* support composite primary keys in table row identification ([d33f4a0](https://github.com/kunish-homelab/sql-pro/commit/d33f4a0f5bb7a4aca104465a50b89da42c636370))


### Bug Fixes

* correct gzip magic number case sensitivity in compression checks ([2756a63](https://github.com/kunish-homelab/sql-pro/commit/2756a63317ece62be4c43fdde3d5dee645a72689))
* format JSON structure and add tableMetadata to Sidebar component ([3414253](https://github.com/kunish-homelab/sql-pro/commit/34142535c589030111430b10f3238f6dda78d384))
* format script_commands and package_managers for consistency ([d0d3a49](https://github.com/kunish-homelab/sql-pro/commit/d0d3a49e1016da41f64422355f9defbe8677f431))
* improve styling and layout in SchemaSection and TableItem components ([26624f5](https://github.com/kunish-homelab/sql-pro/commit/26624f5abbede00f2d3599172763d0dccaaa7ab4))
* remove specific auto-claude files from .gitignore ([604b0e5](https://github.com/kunish-homelab/sql-pro/commit/604b0e5b7a93dce3c4711b5388a01a2e5894a510))
* update titlebar component documentation for clarity ([04f60ca](https://github.com/kunish-homelab/sql-pro/commit/04f60ca323ac7cd9020cbc61687d985dd1a78a89))
* update toggle schema details shortcut key from '0' to '\' ([6acf5e1](https://github.com/kunish-homelab/sql-pro/commit/6acf5e122370300a8dda3938640184799565b4f9))

## [1.10.0](https://github.com/kunish-homelab/sql-pro/compare/v1.9.0...v1.10.0) (2026-01-04)

### Features

- **ci:** add CI workflow configuration and guidelines for Nx ([77bc5e9](https://github.com/kunish-homelab/sql-pro/commit/77bc5e99156a9ced734b1c6b4d1be93bb4d5ea00))
- **commands:** add shortcut for recent connections (Ctrl+R) ([feae1fd](https://github.com/kunish-homelab/sql-pro/commit/feae1fd06f20539cbcee29b1bb74bae33846b82d))
- **data-table:** pass isExpanded prop to GroupRow for re-rendering on state change ([18314f2](https://github.com/kunish-homelab/sql-pro/commit/18314f2ddce962aaf7f936db783876fc1b539b6d))
- **data-tabs:** enhance tab state management with pagination, sorting, grouping, and filters ([18314f2](https://github.com/kunish-homelab/sql-pro/commit/18314f2ddce962aaf7f936db783876fc1b539b6d))
- **nx-cloud:** setup nx cloud workspace ([#32](https://github.com/kunish-homelab/sql-pro/issues/32)) ([8d40bb5](https://github.com/kunish-homelab/sql-pro/commit/8d40bb5c7eeb6927bd4ee72dfc01e0a8b1ff1af9))
- **shortcuts:** improve connection switching shortcuts ([32d115e](https://github.com/kunish-homelab/sql-pro/commit/32d115e5ec4fe642b69236fc17f796ef063e9a98))
- **storage:** add logging for renderer state operations ([dc6b2de](https://github.com/kunish-homelab/sql-pro/commit/dc6b2de0e6ac455cde4b3b60ae6ce179cf480133))
- **storage:** implement centralized persistence and hydration for renderer state ([cae0041](https://github.com/kunish-homelab/sql-pro/commit/cae0041d30cc94954a7e34bc2cdc7464131a774c))
- watch SQLite files for external changes and auto-reload schema and table data ([#34](https://github.com/kunish-homelab/sql-pro/issues/34)) ([d317527](https://github.com/kunish-homelab/sql-pro/commit/d317527a001494a7a9e597efb58692df69f85a58))

### Bug Fixes

- **ci:** add auto-apply fixes for format, lint, test, and build in CI run ([32b0e26](https://github.com/kunish-homelab/sql-pro/commit/32b0e26d527e7ea89407f0a6c5fe80cb582d4e5e))
- **ci:** correct command to start CI run using npx ([426553e](https://github.com/kunish-homelab/sql-pro/commit/426553ecdc253e1e43c32357dd6bbc3c8f90965a))
- **ci:** update command to start CI run using pnpm dlx ([71cfdd7](https://github.com/kunish-homelab/sql-pro/commit/71cfdd757a38244c4eba71def250895644aac767))
- **entitlements:** remove unnecessary keys for macOS security entitlements ([28e1072](https://github.com/kunish-homelab/sql-pro/commit/28e107299cee9c7c00692b211318db6084339817))
- **password:** fix remember password not saving correctly ([a306f1b](https://github.com/kunish-homelab/sql-pro/commit/a306f1b91adaa130abbaad4e7727d4fa64eab683))
- **storage:** check electron environment dynamically at each operation ([edc94f4](https://github.com/kunish-homelab/sql-pro/commit/edc94f40abf5d20e14ecb84359cc73f3739542c0))
- **storage:** fix font settings not saving and missing sql-log handler ([71babac](https://github.com/kunish-homelab/sql-pro/commit/71babacb201ed43bfdde55b2130d46fca674ae97))
- **storage:** initialize electron storage before app render ([62a5109](https://github.com/kunish-homelab/sql-pro/commit/62a510991ddccbf8b4817fb63cd3a3a946fa5efe))

## [1.9.0](https://github.com/kunish-homelab/sql-pro/compare/v1.8.0...v1.9.0) (2026-01-03)

### Features

- add keyboard shortcuts for recent, next, and previous connections ([cb4bfa0](https://github.com/kunish-homelab/sql-pro/commit/cb4bfa0bf49be9f5f708e15cdbad5cdbb21a31c3))
- **connection-store:** implement unsaved changes tracking for connections ([8ba034e](https://github.com/kunish-homelab/sql-pro/commit/8ba034e9e0f1450b430f755897e2d0891bb3909c))
- **data-diff:** add data comparison summary and row difference cards ([4b3af88](https://github.com/kunish-homelab/sql-pro/commit/4b3af8858f2e3feab097da83fa477f8430bdb0ca))
- **ipc:** add handlers for retrieving recent connections and checking password availability ([285f698](https://github.com/kunish-homelab/sql-pro/commit/285f69819aba5322157d331e0b75409747a454a7))
- **ipc:** split into multiple modules ([38434ed](https://github.com/kunish-homelab/sql-pro/commit/38434ede0ddec19cefccd0a68b2bc3f59d6ebf17))
- **mock-api:** enhance mock mode detection and add new mock operations ([a1d092f](https://github.com/kunish-homelab/sql-pro/commit/a1d092fffb3f3bcd74b85e93bf9b2ccee9ae0e26))
- refactor QueryEditor and CollectionsList components ([2721c4b](https://github.com/kunish-homelab/sql-pro/commit/2721c4b47836f7850983213ed57d8e6ff0858799))
- **schema-comparison:** add API methods for schema comparison operations ([84d117b](https://github.com/kunish-homelab/sql-pro/commit/84d117bde4cf884592632844b4d9175969c1dcb0))
- **store:** enhance connection store with serialization for Maps and Sets ([38434ed](https://github.com/kunish-homelab/sql-pro/commit/38434ede0ddec19cefccd0a68b2bc3f59d6ebf17))

### Bug Fixes

- **data-diff:** improve layout and accessibility of comparison controls ([25ec5a2](https://github.com/kunish-homelab/sql-pro/commit/25ec5a2d16ccfbcbaa67353dab6987f71c850719))
- **schema-comparison:** improve className handling in SchemaComparisonPanel ([88c6f3c](https://github.com/kunish-homelab/sql-pro/commit/88c6f3c2213d0cbe938613333476a198506e8315))
- **vitest:** update alias configuration for Vitest ([8ba034e](https://github.com/kunish-homelab/sql-pro/commit/8ba034e9e0f1450b430f755897e2d0891bb3909c))

## [1.8.0](https://github.com/kunish-homelab/sql-pro/compare/v1.7.0...v1.8.0) (2026-01-02)

### Features

- add BulkEditDialog component and integrate with TableView for bulk editing of selected rows ([35900e7](https://github.com/kunish-homelab/sql-pro/commit/35900e7eb4662545acee8284a2e1f0cd4b7721b9))
- add customizable keyboard shortcuts and settings dialog ([4d8a652](https://github.com/kunish-homelab/sql-pro/commit/4d8a65233028417e68dae7c655742631747afc32))
- add grid color variables and subtle grid background styles ([c0cb1a1](https://github.com/kunish-homelab/sql-pro/commit/c0cb1a16effffc4af002c7c5be5a8074b0670517))
- add grid color variables and subtle grid background styles ([78eedd3](https://github.com/kunish-homelab/sql-pro/commit/78eedd3d4c49bb3d329868ea3eb3aea4213adf60))
- add recent connection handling to ConnectionSelector and related components ([c56f8ca](https://github.com/kunish-homelab/sql-pro/commit/c56f8ca8ec6ee59db3db6641aad1e30c585afdcd))
- add SchemaExportDialog component for schema sharing ([2bd1062](https://github.com/kunish-homelab/sql-pro/commit/2bd1062ec1282a600f61d9f6cb4ac1a4592de21b))
- add sidebar toggle functionality and integrate with settings store ([35a56d7](https://github.com/kunish-homelab/sql-pro/commit/35a56d7f4e4654c3e813c5e6142cd05fd7386396))
- add SqlHighlight component for syntax highlighting of SQL code ([5e7cb7c](https://github.com/kunish-homelab/sql-pro/commit/5e7cb7c4352335e249d10026fbfe6d06f9d78d99))
- **data-table:** add row virtualization for large datasets ([829c480](https://github.com/kunish-homelab/sql-pro/commit/829c480027ccced5fdb21cb8d4bcc5352c60d0a2))
- enhance drag and drop functionality in ConnectionTabBar ([20af8c9](https://github.com/kunish-homelab/sql-pro/commit/20af8c96a6ce9d6d0df680dcd6749ad4969a640b))
- enhance security with Content Security Policy in index.html ([d90c925](https://github.com/kunish-homelab/sql-pro/commit/d90c925fe5aff59f5e1f5870803ec1708fc424c2))
- enhance security with Content Security Policy in index.html ([b1426ae](https://github.com/kunish-homelab/sql-pro/commit/b1426aeb618ada34a13026c02af0bbecc50f1e53))
- enhance UI components with improved layouts and keyboard navigation ([ef68614](https://github.com/kunish-homelab/sql-pro/commit/ef686140b07dfa5f562bbd12e5cfac3ea479a343))
- enhance UI components with improved layouts and keyboard navigation ([a0866e0](https://github.com/kunish-homelab/sql-pro/commit/a0866e03694a072d8661d908ea3a5bbd3113c91b))
- implement table organization features with sorting and tagging capabilities ([2ad24ca](https://github.com/kunish-homelab/sql-pro/commit/2ad24ca30c8d398dc813a25baaff0788567fdb41))
- multiple sql query ([3c37801](https://github.com/kunish-homelab/sql-pro/commit/3c37801e27d13f0ae1d1048b1e6b869f47f3e59a))
- multiple sql query results ([0d6735e](https://github.com/kunish-homelab/sql-pro/commit/0d6735ea176a4ff2ed4a2baadad4549fa11737e2))
- **pagination:** add quick page jump input ([46a90e9](https://github.com/kunish-homelab/sql-pro/commit/46a90e97f6c2698cb80266bb07569a1c050e248c))
- pro feature gates ([f10fe26](https://github.com/kunish-homelab/sql-pro/commit/f10fe2631115c67889adb75c099477a9f72a1c53))
- refactor database connection handling and improve error management ([89b14ba](https://github.com/kunish-homelab/sql-pro/commit/89b14ba1f01e76f56d23a250b9837a2d298e43b9))
- refactor UI components for improved consistency and performance ([2901cdd](https://github.com/kunish-homelab/sql-pro/commit/2901cdd7300f5082b35b063cab4dbb6ae7af5ad4))
- refactor UI components for improved layout and functionality ([6f4e68e](https://github.com/kunish-homelab/sql-pro/commit/6f4e68ee38575a49b2f9482005f9e4437cadbf4b))
- replace static kbd elements with ShortcutKbd component for dynamic shortcut display ([f36736f](https://github.com/kunish-homelab/sql-pro/commit/f36736fe4557999303d479ce43daa5d16154bb12))
- show recent connections in connection selector dropdown ([8f9ef76](https://github.com/kunish-homelab/sql-pro/commit/8f9ef76028b28faf201c9928b825ab3be6bc224e))
- **sidebar:** add table context menu with operations ([fb125e9](https://github.com/kunish-homelab/sql-pro/commit/fb125e9971d5ac3548c8bd94f94f90e31447f237))
- **sidebar:** switch to SQL Query tab and add confirmation dialogs ([d1fdb30](https://github.com/kunish-homelab/sql-pro/commit/d1fdb30793022d2b00df6285217cbec254fdcbb9))
- **sql-log:** add SQL log panel and logging functionality ([af82455](https://github.com/kunish-homelab/sql-pro/commit/af82455e5b9e85e39e3ce82c59e5a24a75ed9ca9))
- **sql-log:** add SQL log panel and logging functionality ([6e63e66](https://github.com/kunish-homelab/sql-pro/commit/6e63e66efc05e50fe0061351246922ab786055ec))
- **ui:** add creative table view enhancements ([d81b1b9](https://github.com/kunish-homelab/sql-pro/commit/d81b1b994eb7a12fafe1cb03811d11f6daf60804))
- **ui:** add creative table view enhancements ([a68be01](https://github.com/kunish-homelab/sql-pro/commit/a68be0101cfef65308cd3be4e6465c6173c4df1f))

### Bug Fixes

- add groupCount prop to HeaderCell for accurate grouping display ([897a97c](https://github.com/kunish-homelab/sql-pro/commit/897a97cd7f4c14a392209bbd48107b0580faf54e))
- adjust selection column width for better alignment and consistency ([c824dbc](https://github.com/kunish-homelab/sql-pro/commit/c824dbccde78fb7a59341dbb7a3a65f2e10e301d))
- ai settings ([291f8a7](https://github.com/kunish-homelab/sql-pro/commit/291f8a7db30f389c0994185277b63c08126a5d26))
- **connection-selector:** apply table font settings ([f288b83](https://github.com/kunish-homelab/sql-pro/commit/f288b83885fdd7f6350552d2bad40c40a3e03349))
- **connection-selector:** dropdown width matches trigger width ([41cce77](https://github.com/kunish-homelab/sql-pro/commit/41cce7764e7ab9072cae90431dcd32e840556583))
- correct CATEGORY_LABELS to FONT_CATEGORY_LABELS reference ([90cdb8c](https://github.com/kunish-homelab/sql-pro/commit/90cdb8c5d14f2f771f3871c2014ab45a17e83cfd))
- correct class names for improved styling in SqlLogPanel, Toolbar, Select, and Tabs components ([f7bcaa1](https://github.com/kunish-homelab/sql-pro/commit/f7bcaa14b5e2d6757181653d868835ac69486978))
- **data-table:** adjust row height and improve virtualization handling ([99b5960](https://github.com/kunish-homelab/sql-pro/commit/99b59600128140306cfdcf2d5d12f5cf9f87da0f))
- enhance dropdown menu item styling for better readability ([36b1882](https://github.com/kunish-homelab/sql-pro/commit/36b188204cfd815273663ad54beeb21e5b6095f1))
- ensure hooks return undefined for consistency in various components ([e767f2c](https://github.com/kunish-homelab/sql-pro/commit/e767f2cabb5642589bee55a4cd73df5c602a281c))
- ensure watch mode is disabled in vitest configuration ([9045a3f](https://github.com/kunish-homelab/sql-pro/commit/9045a3f2d9a533b555438bdaf7847303b14fd541))
- **er-diagram:** ensure handles are always rendered for edge connections ([274d523](https://github.com/kunish-homelab/sql-pro/commit/274d5238e326ececf97eac9058ed655d1eacf491))
- **er-diagram:** fix edge stroke color CSS variable format ([3cee083](https://github.com/kunish-homelab/sql-pro/commit/3cee08351c787190956f0a4bab4131958705b871))
- **er-diagram:** fix Handle positioning for proper edge connections ([1aa5f4b](https://github.com/kunish-homelab/sql-pro/commit/1aa5f4bba52dbf8336d81a93f4982d34fcf9c935))
- fetch system font timeout ([290d029](https://github.com/kunish-homelab/sql-pro/commit/290d0291bd9b39f60b6121d1c1aa67bbfa7b72bb))
- pagination ([67fc04d](https://github.com/kunish-homelab/sql-pro/commit/67fc04d9475f05df8e01a90bb57f1d7f2f46e72a))
- persist search term per table tab ([9356c8e](https://github.com/kunish-homelab/sql-pro/commit/9356c8e4d079e3231414aeec9252108fd847a56a))
- preset selector dropdown text truncation ([833c445](https://github.com/kunish-homelab/sql-pro/commit/833c4453611ce85eef1015fc6cbf69bd2396f082))
- refactor CollapsibleTrigger to use render prop for better flexibility ([0739c6e](https://github.com/kunish-homelab/sql-pro/commit/0739c6eea769f4712b4b747e4142eac6d46aa434))
- remove background from line variant tabs on active state ([c709c9e](https://github.com/kunish-homelab/sql-pro/commit/c709c9e42ecf004776aaaadd26d78893dcb6b3a6))
- resolve typecheck errors in font optimization and new components ([aa63e4f](https://github.com/kunish-homelab/sql-pro/commit/aa63e4f5747f1829d8dbef3f1e641f1b9bd51093))
- scroll-area ([0bfb0aa](https://github.com/kunish-homelab/sql-pro/commit/0bfb0aa32e3d17cc41018a04e282795650f49e23))
- shortcutKbd now re-renders when preset changes ([087c75d](https://github.com/kunish-homelab/sql-pro/commit/087c75dd34b6926b0dee3f97f842e2639f0f8a9a))
- **ui:** add CSS rules for font size inheritance ([93c25e2](https://github.com/kunish-homelab/sql-pro/commit/93c25e2279bfda76fda3dcd6e0f34892a476a248))
- **ui:** add nativeButton prop to all Base UI trigger components ([24f4194](https://github.com/kunish-homelab/sql-pro/commit/24f419430871f314d7e1676680828431b644fd80))
- **ui:** remove nativeButton from unsupported trigger components ([6e765d8](https://github.com/kunish-homelab/sql-pro/commit/6e765d8e9ba150a875741f697ca368c2355c793b))
- **ui:** wrap GroupLabel in Group for context in context and dropdown menus ([707a44a](https://github.com/kunish-homelab/sql-pro/commit/707a44a46a7f4407bfb2fe4236cad5c294b8b2fe))
- update folder selection handling and improve placeholder display ([12f0622](https://github.com/kunish-homelab/sql-pro/commit/12f06221a93ba2c10f692c3b289284f4b8dd1a47))
- update import paths and improve component properties for better functionality ([96add90](https://github.com/kunish-homelab/sql-pro/commit/96add9059727005484b6cc473c6f20831f187e2e))
- update max-width classes for better responsiveness in data table components ([f244ee7](https://github.com/kunish-homelab/sql-pro/commit/f244ee73268cda439938f2715307a16b429fb0f0))
- update max-width classes for better responsiveness in data table components ([c4b20a7](https://github.com/kunish-homelab/sql-pro/commit/c4b20a7a6f44c25e2a6d1f2476a57fb559f3a9d5))
- update SQL formatting shortcut for macOS to use Option/Alt key ([49f9d80](https://github.com/kunish-homelab/sql-pro/commit/49f9d80854977bb0c8056777843281d2854cc08f))
- use onClick instead of onSelect for DropdownMenuItem ([bbe1bcb](https://github.com/kunish-homelab/sql-pro/commit/bbe1bcbe540f190a5feeaafc101bdfa5cbfaf6ba))

## [1.7.0](https://github.com/kunish-homelab/sql-pro/compare/v1.6.0...v1.7.0) (2025-12-31)

### Features

- add Claude Code path support for Anthropic provider ([de7b3f3](https://github.com/kunish-homelab/sql-pro/commit/de7b3f3885364f5cd365ce80c58249faf6e6a3e5))
- auto updater ([9280a68](https://github.com/kunish-homelab/sql-pro/commit/9280a682b5b00ae0f8850c6f7ab9e6e8499ca242))
- electron-builder identity ([433fcf4](https://github.com/kunish-homelab/sql-pro/commit/433fcf4734bf24c981d125b1a987d12593886709))
- enhance column resizing functionality and improve layout handling ([b2acff1](https://github.com/kunish-homelab/sql-pro/commit/b2acff185c82b1e789ede51b1131a82938962430))
- error handling ([a3e1194](https://github.com/kunish-homelab/sql-pro/commit/a3e11944b38bb297b2b303a91fe932f22329369c))
- export ([dc7c909](https://github.com/kunish-homelab/sql-pro/commit/dc7c9090824b1b223fd704e962baf4b8d11483f3))
- integrate table font settings ([a342a41](https://github.com/kunish-homelab/sql-pro/commit/a342a41c490dd5693886274e365167fa14a6f0d3))
- multiple connections ([0bf08fa](https://github.com/kunish-homelab/sql-pro/commit/0bf08fa4f7461689dab092f5ba1f98aedf2697a6))
- multiple tabs support ([ed71fb6](https://github.com/kunish-homelab/sql-pro/commit/ed71fb6f0d2d926e18444a086479e9ca47bce0bd))
- optimize data table layout ([1012a43](https://github.com/kunish-homelab/sql-pro/commit/1012a43ec2c5c6faa235530c98704575cc60d7f2))
- plugin-sdk ([5882a81](https://github.com/kunish-homelab/sql-pro/commit/5882a81655b369013707137e5a5809e0477268fe))
- refactor CommandPalette with shadcn ([a65b4f9](https://github.com/kunish-homelab/sql-pro/commit/a65b4f991dce7e0dbef366cecb8b969684134c1e))
- replace AISettingsDialog with SettingsDialog ([9cb4c7e](https://github.com/kunish-homelab/sql-pro/commit/9cb4c7e72c0edfcff3fa496053c77f8614298314))
- update ai-powered features ([d5642a6](https://github.com/kunish-homelab/sql-pro/commit/d5642a68cdde3045503d2aafdc4b2d99e902e874))
- update electron-builder configurations ([c95ea70](https://github.com/kunish-homelab/sql-pro/commit/c95ea70c038d677c3a622ffa3f397e3f4283ee00))

### Bug Fixes

- build ([abb7e52](https://github.com/kunish-homelab/sql-pro/commit/abb7e527607d2f2c06dca9fa5631a0b06afe6d18))
- lint ([2fbcc26](https://github.com/kunish-homelab/sql-pro/commit/2fbcc26b48679f09cc08ecc1b96d4261c4b2fef8))
- multi-tab table view ([a7389e1](https://github.com/kunish-homelab/sql-pro/commit/a7389e19604a43d6c4236e66727e0739dcfb7f50))
- open connection settings dialog z-index ([0bcc8d1](https://github.com/kunish-homelab/sql-pro/commit/0bcc8d1b515cc4c550b668d277ce76535e02522d))
- remove unnecessary class from rowCount ([6d20d38](https://github.com/kunish-homelab/sql-pro/commit/6d20d3801c0f355d731927601985cfb6dd30bf81))
- sql editor and history ([01d8132](https://github.com/kunish-homelab/sql-pro/commit/01d8132bb3d12687dcd3220c483d061c593e4745))
- system fonts ([681beea](https://github.com/kunish-homelab/sql-pro/commit/681beea16fcedae405221010d99d7445e5bfe90e))
- update kbd component styles to use text-muted-foreground for better visibility ([4e0518c](https://github.com/kunish-homelab/sql-pro/commit/4e0518c2bd4279626e18950d0eef0023d87075b0))

## [1.6.0](https://github.com/kunish-homelab/sql-pro/compare/v1.5.0...v1.6.0) (2025-12-29)

### Features

- update pnpm-workspace.yaml ([90bea2f](https://github.com/kunish-homelab/sql-pro/commit/90bea2fa4801c5fe78caf7ec21497eedc40111e6))

## [1.5.0](https://github.com/kunish-homelab/sql-pro/compare/v1.4.0...v1.5.0) (2025-12-29)

### Features

- ER Diagram auto layout ([88ada1b](https://github.com/kunish-homelab/sql-pro/commit/88ada1be8def5f5c00451b2bb56f6a56a06d1552))

### Bug Fixes

- command palette ([1867efa](https://github.com/kunish-homelab/sql-pro/commit/1867efab4fcfa02f530b5119c0c970efa2b9957d))

## [1.4.0](https://github.com/kunish-homelab/sql-pro/compare/v1.3.0...v1.4.0) (2025-12-29)

### Features

- add @radix-ui/react-label dependency and update related components ([ef50abc](https://github.com/kunish-homelab/sql-pro/commit/ef50abcd3e6c903e0ba367c05d6705ea8433f576))
- add initial .auto-claude-status file and update .claude_settings.json ([88cd6c2](https://github.com/kunish-homelab/sql-pro/commit/88cd6c214124ca4f12ce5672bdd056daa5e8489b))
- add platform-specific app icon handling and improve dock icon on macOS ([9fdbddf](https://github.com/kunish-homelab/sql-pro/commit/9fdbddf8bc9f6c9c60eabfd958eea9ba51afc5e5))
- add schema support to various components and mock API ([c05ee5f](https://github.com/kunish-homelab/sql-pro/commit/c05ee5f6c16b7f190dad53b727fff0c089ee53f3))
- ai-powered features ([b0e5236](https://github.com/kunish-homelab/sql-pro/commit/b0e5236063b2de64b7c31cc3e8ef5dc3a89d1bae))
- ai-powered features ([7609f2a](https://github.com/kunish-homelab/sql-pro/commit/7609f2a544ce4f5e035c2e454e65fb86cf849649))
- analyze ([98aabfa](https://github.com/kunish-homelab/sql-pro/commit/98aabfae9e4a183b123a7c33dc1079c77330067b))
- docs ([c2d952f](https://github.com/kunish-homelab/sql-pro/commit/c2d952ff0ae90a7fbdf800b6b0824afaa26c7d72))
- enhance font loading with fallback options and update connection settings handling ([e015d30](https://github.com/kunish-homelab/sql-pro/commit/e015d3053ac923357c08772240ff805e69bd18a5))
- enhance schema handling in sidebar and table views ([bb06f29](https://github.com/kunish-homelab/sql-pro/commit/bb06f293b2dc99505236bc396f36b83bb9aea580))
- enhance UI components with improved styling and layout adjustments ([1e78aa5](https://github.com/kunish-homelab/sql-pro/commit/1e78aa586e47ca82dba55432be9d6d0ef2fbc18e))
- erdiagram ([82e5dd0](https://github.com/kunish-homelab/sql-pro/commit/82e5dd05410231cd3b9aa54224fcadb38e8b91ed))
- **history:** add Clear All button with confirmation dialog ([398bed2](https://github.com/kunish-homelab/sql-pro/commit/398bed2fb4deb65e416c02fe349140d67cd8d475))
- **history:** display execution duration with formatDuration helper ([338dcbc](https://github.com/kunish-homelab/sql-pro/commit/338dcbc9d974b64a53b89c6848d3ac32a42f7fd1))
- split pane ([9d3ac11](https://github.com/kunish-homelab/sql-pro/commit/9d3ac11ab4eed5ec8b71d9db8e13c38954a201f7))
- **ui:** add Popover component for filter dropdowns ([26dd959](https://github.com/kunish-homelab/sql-pro/commit/26dd959f6f6bf654d8e968e143046315212c8859))
- **ui:** add Select component for filter operator dropdowns ([c5d0858](https://github.com/kunish-homelab/sql-pro/commit/c5d0858788b24bb7a3ad43dff1c60cc17d194c28))
- update .gitignore to include .worktrees and adjust .claude-flow entry ([ad7d4f2](https://github.com/kunish-homelab/sql-pro/commit/ad7d4f2de7b949b15f0ed6b30ecb8def680eb17f))
- update pnpm workspace configuration and enhance UI components ([01899b1](https://github.com/kunish-homelab/sql-pro/commit/01899b1afae9ecee04a0c260367b8722d9ab4cb1))
- update TailwindCSS styles ([e22facd](https://github.com/kunish-homelab/sql-pro/commit/e22facd957d15c1fee6cc4e17bfb755dfd52d23f))
- update UI components with grid background styles and improve layout ([5c26fc2](https://github.com/kunish-homelab/sql-pro/commit/5c26fc23bbf002548bc70ad7d290983a9af8c987))

### Bug Fixes

- add h-0 class to QueryResults container to fix scrolling ([b9a896b](https://github.com/kunish-homelab/sql-pro/commit/b9a896bdd54dfaf7dd428a8331004176e6158e4b))
- add missing newline at end of .claude_settings.json ([f193466](https://github.com/kunish-homelab/sql-pro/commit/f1934662fdfe3c30de98a4de0acd20f54afba3c0))
- **docs:** correct broken anchor link in shortcuts.md ([eb3032f](https://github.com/kunish-homelab/sql-pro/commit/eb3032f37f74cdcf5558a94b0bbcd56a0fb5569f))
- improve layout and scrolling behavior ([ef14049](https://github.com/kunish-homelab/sql-pro/commit/ef14049f495a97c349997b280b2e86dfb25f08cd))

## [1.3.0](https://github.com/kunish-homelab/sql-pro/compare/v1.2.0...v1.3.0) (2025-12-27)

### Features

- add Vim key navigation support and command palette ([4de0c99](https://github.com/kunish-homelab/sql-pro/commit/4de0c993b26387ba4d34b62fd6ece42fa928b73e))

## [1.2.0](https://github.com/kunish-homelab/sql-pro/compare/v1.1.1...v1.2.0) (2025-12-26)

### Features

- add GitHub release configuration to electron-builder ([3fcdcd6](https://github.com/kunish-homelab/sql-pro/commit/3fcdcd6c9a3213ff36de0a18adfcb521e66339bb))

## [1.1.1](https://github.com/kunish-homelab/sql-pro/compare/v1.1.0...v1.1.1) (2025-12-26)

### Bug Fixes

- update Node.js version handling in release workflow ([a494209](https://github.com/kunish-homelab/sql-pro/commit/a494209bee6c3eafb0b550cae6f8dd4af2c1ad2a))

## [1.1.0](https://github.com/kunish-homelab/sql-pro/compare/v1.0.0...v1.1.0) (2025-12-26)

### Features

- integrate mock API for development and testing ([a97fd89](https://github.com/kunish-homelab/sql-pro/commit/a97fd89706d47da9da8effe4adecc3dc0b417b27))

## 1.0.0 (2025-12-26)

### Features

- add ConnectionSettingsDialog component for managing connection settings ([b307b95](https://github.com/kunish-homelab/sql-pro/commit/b307b95c9162d5303bd35325fe8013102a35dd55))
- add Dependabot configuration and GitHub Actions workflow for automated releases ([6581d8d](https://github.com/kunish-homelab/sql-pro/commit/6581d8dfbf90e0959116f9e5d849a661310f31b3))
- add electron-builder configuration and icon generation scripts ([8b3f6e7](https://github.com/kunish-homelab/sql-pro/commit/8b3f6e71e0a83abc7d3debb2d973bd9cbae964c2))
- add global types for ElectronAPI and SqlProAPI in preload and renderer ([26d4850](https://github.com/kunish-homelab/sql-pro/commit/26d4850e99bdf7c2e17fb5c320bc04a9861ede59))
- add hash history for Electron compatibility in router ([8ad7b7a](https://github.com/kunish-homelab/sql-pro/commit/8ad7b7a907cb2f095b2af34f74fe3786341e18dc))
- add Monaco SQL editor with autocomplete and theme support ([29aa6f4](https://github.com/kunish-homelab/sql-pro/commit/29aa6f4bd2cfc26f44ea630eede354aa2da5bc70))
- add undo functionality and keyboard navigation to Editable components ([c204fb3](https://github.com/kunish-homelab/sql-pro/commit/c204fb3299879022bdc6aaf8eaca919dc83a04a1))
- add WelcomeScreen component and related UI elements ([dcafc53](https://github.com/kunish-homelab/sql-pro/commit/dcafc53a9e2585f8638510baec4eee16d8e40dcd))
- **data-table:** implement editable table with virtual scrolling and resizable columns ([9e16133](https://github.com/kunish-homelab/sql-pro/commit/9e16133ef3b8e862458fda14a5d2a2ce0522878c))
- enhance data handling with reload trigger and improved change management ([465707d](https://github.com/kunish-homelab/sql-pro/commit/465707dd0c0e274ff839abe728291bc63feacfe1))
- enhance password management with storage options and UI updates ([b03f862](https://github.com/kunish-homelab/sql-pro/commit/b03f862cc90e07017cfbcae3241f38f4d8d1233e))
- implement resizable panels and theme toggle functionality ([41f6f2b](https://github.com/kunish-homelab/sql-pro/commit/41f6f2bccb4292407afa65f551680088d4c6b5d1))
- integrate Tailwind CSS with Vite and remove PostCSS configuration ([99baa8a](https://github.com/kunish-homelab/sql-pro/commit/99baa8a9b25fe6567c1e54c5195a37239014a857))

### Bug Fixes

- reorder scripts in package.json for better organization ([e6b72e0](https://github.com/kunish-homelab/sql-pro/commit/e6b72e021b13521b37f0b706ff13e87909b21cd7))
