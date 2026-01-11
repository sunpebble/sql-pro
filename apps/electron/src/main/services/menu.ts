import type { MenuAction, ShortcutPreset } from '@shared/types';
import process from 'node:process';
import {
  bindingToAccelerator,
  DEFAULT_SHORTCUTS,
  IPC_CHANNELS,
} from '@shared/types';
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { checkForUpdates } from './updater';
import { windowManager } from './window-manager';

// Current shortcuts state (synced from renderer)
let currentShortcuts: ShortcutPreset = DEFAULT_SHORTCUTS;

// Current language (synced from renderer)
let currentLanguage: 'en' | 'zh' = 'en';

// Menu translations
const menuTranslations = {
  en: {
    file: 'File',
    newWindow: 'New Window',
    openDatabase: 'Open Database...',
    closeDatabase: 'Close Database',
    closeWindow: 'Close Window',
    refreshSchema: 'Refresh Schema',
    refreshTable: 'Refresh Table',
    exportQuery: 'Export Query...',
    importQuery: 'Import Query...',
    exportSchema: 'Export Schema...',
    importSchema: 'Import Schema...',
    settings: 'Settings...',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    pasteAndMatchStyle: 'Paste and Match Style',
    delete: 'Delete',
    selectAll: 'Select All',
    view: 'View',
    commandPalette: 'Command Palette...',
    dataBrowser: 'Data Browser',
    sqlQuery: 'SQL Query',
    schemaCompare: 'Schema Compare',
    queryHistory: 'Query History',
    developer: 'Developer',
    memoryMonitor: 'Memory Monitor',
    query: 'Query',
    executeQuery: 'Execute Query',
    viewUnsavedChanges: 'View Unsaved Changes',
    window: 'Window',
    help: 'Help',
    keyboardShortcuts: 'Keyboard Shortcuts',
    checkForUpdates: 'Check for Updates...',
    learnMore: 'Learn More',
    reportIssue: 'Report Issue',
    closeAll: 'Close All',
  },
  zh: {
    file: '文件',
    newWindow: '新建窗口',
    openDatabase: '打开数据库...',
    closeDatabase: '关闭数据库',
    closeWindow: '关闭窗口',
    refreshSchema: '刷新结构',
    refreshTable: '刷新表',
    exportQuery: '导出查询...',
    importQuery: '导入查询...',
    exportSchema: '导出结构...',
    importSchema: '导入结构...',
    settings: '设置...',
    edit: '编辑',
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    pasteAndMatchStyle: '粘贴并匹配样式',
    delete: '删除',
    selectAll: '全选',
    view: '视图',
    commandPalette: '命令面板...',
    dataBrowser: '数据浏览',
    sqlQuery: 'SQL 查询',
    schemaCompare: '结构对比',
    queryHistory: '查询历史',
    developer: '开发者',
    memoryMonitor: '内存监控',
    query: '查询',
    executeQuery: '执行查询',
    viewUnsavedChanges: '查看未保存更改',
    window: '窗口',
    help: '帮助',
    keyboardShortcuts: '键盘快捷键',
    checkForUpdates: '检查更新...',
    learnMore: '了解更多',
    reportIssue: '报告问题',
    closeAll: '全部关闭',
  },
};

// Helper to get translated string
function t(key: keyof typeof menuTranslations.en): string {
  return menuTranslations[currentLanguage][key];
}

/**
 * Get accelerator for a shortcut action
 */
function getAccelerator(action: keyof ShortcutPreset): string | undefined {
  return bindingToAccelerator(currentShortcuts[action]);
}

function sendMenuAction(action: MenuAction): void {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.webContents.send(IPC_CHANNELS.MENU_ACTION, action);
  }
}

/**
 * Build and set the application menu with current shortcuts
 */
export function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: t('settings'),
                accelerator: getAccelerator('settings.open'),
                click: () => sendMenuAction('open-settings'),
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // File menu
    {
      label: t('file'),
      submenu: [
        {
          label: t('newWindow'),
          accelerator: getAccelerator('action.new-window'),
          click: () => {
            windowManager.createWindow();
          },
        },
        { type: 'separator' },
        {
          label: t('openDatabase'),
          accelerator: getAccelerator('action.open-database'),
          click: () => sendMenuAction('open-database'),
        },
        {
          label: t('closeDatabase'),
          accelerator: 'CmdOrCtrl+W',
          click: () => sendMenuAction('close-database'),
        },
        {
          label: t('closeWindow'),
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.close();
            }
          },
        },
        { type: 'separator' },
        {
          label: t('refreshSchema'),
          accelerator: getAccelerator('action.refresh-schema'),
          click: () => sendMenuAction('refresh-schema'),
        },
        {
          label: t('refreshTable'),
          accelerator: getAccelerator('action.refresh-table'),
          click: () => sendMenuAction('refresh-table'),
        },
        { type: 'separator' },
        {
          label: t('exportQuery'),
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => sendMenuAction('export-query'),
        },
        {
          label: t('importQuery'),
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => sendMenuAction('import-query'),
        },
        { type: 'separator' },
        {
          label: t('exportSchema'),
          click: () => sendMenuAction('export-schema'),
        },
        {
          label: t('importSchema'),
          click: () => sendMenuAction('import-schema'),
        },
        { type: 'separator' },
        ...(isMac
          ? []
          : [
              {
                label: t('settings'),
                accelerator: getAccelerator('settings.open'),
                click: () => sendMenuAction('open-settings'),
              },
              { type: 'separator' as const },
            ]),
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // Edit menu
    {
      label: t('edit'),
      submenu: [
        { label: t('undo'), role: 'undo' as const },
        { label: t('redo'), role: 'redo' as const },
        { type: 'separator' },
        { label: t('cut'), role: 'cut' as const },
        { label: t('copy'), role: 'copy' as const },
        { label: t('paste'), role: 'paste' as const },
        ...(isMac
          ? [
              {
                label: t('pasteAndMatchStyle'),
                role: 'pasteAndMatchStyle' as const,
              },
              { label: t('delete'), role: 'delete' as const },
              { label: t('selectAll'), role: 'selectAll' as const },
            ]
          : [
              { label: t('delete'), role: 'delete' as const },
              { type: 'separator' as const },
              { label: t('selectAll'), role: 'selectAll' as const },
            ]),
      ],
    },

    // View menu
    {
      label: t('view'),
      submenu: [
        {
          label: t('commandPalette'),
          accelerator: getAccelerator('action.command-palette'),
          click: () => sendMenuAction('toggle-command-palette'),
        },
        { type: 'separator' },
        {
          label: t('dataBrowser'),
          accelerator: getAccelerator('nav.data-browser'),
          click: () => sendMenuAction('switch-to-data'),
        },
        {
          label: t('sqlQuery'),
          accelerator: getAccelerator('nav.query-editor'),
          click: () => sendMenuAction('switch-to-query'),
        },
        {
          label: t('schemaCompare'),
          accelerator: getAccelerator('nav.schema-compare'),
          click: () => sendMenuAction('switch-to-schema-compare'),
        },
        { type: 'separator' },
        {
          label: t('queryHistory'),
          accelerator: getAccelerator('view.toggle-history'),
          click: () => sendMenuAction('toggle-history'),
        },
        // Developer submenu only in development mode
        ...(!app.isPackaged
          ? [
              { type: 'separator' as const },
              {
                label: t('developer'),
                submenu: [
                  { role: 'toggleDevTools' as const },
                  { type: 'separator' as const },
                  {
                    label: t('memoryMonitor'),
                    accelerator: 'CmdOrCtrl+Shift+M',
                    click: () => sendMenuAction('toggle-memory-monitor'),
                  },
                ],
              },
            ]
          : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // Query menu
    {
      label: t('query'),
      submenu: [
        {
          label: t('executeQuery'),
          accelerator: getAccelerator('action.execute-query'),
          click: () => sendMenuAction('execute-query'),
        },
        { type: 'separator' },
        {
          label: t('viewUnsavedChanges'),
          accelerator: getAccelerator('action.view-changes'),
          click: () => sendMenuAction('view-changes'),
        },
      ],
    },

    // Window menu
    {
      label: t('window'),
      submenu: [
        {
          label: t('newWindow'),
          accelerator: getAccelerator('action.new-window'),
          click: () => {
            windowManager.createWindow();
          },
        },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },

    // Help menu
    {
      label: t('help'),
      submenu: [
        {
          label: t('keyboardShortcuts'),
          click: () => sendMenuAction('show-shortcuts'),
        },
        { type: 'separator' },
        {
          label: t('checkForUpdates'),
          click: () => {
            checkForUpdates(false);
          },
        },
        { type: 'separator' },
        {
          label: t('learnMore'),
          click: async () => {
            await shell.openExternal('https://github.com/nicepkg/sql-pro');
          },
        },
        {
          label: t('reportIssue'),
          click: async () => {
            await shell.openExternal(
              'https://github.com/nicepkg/sql-pro/issues'
            );
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Update shortcuts and rebuild menu
 */
export function updateShortcuts(shortcuts: ShortcutPreset): void {
  currentShortcuts = shortcuts;
  createApplicationMenu();
}

/**
 * Update language and rebuild menu
 */
export function updateLanguage(language: 'en' | 'zh'): void {
  currentLanguage = language;
  createApplicationMenu();
}

/**
 * Register IPC handler for shortcuts sync
 */
export function registerShortcutsHandler(): void {
  ipcMain.handle(
    IPC_CHANNELS.SHORTCUTS_UPDATE,
    (_event, payload: { shortcuts: ShortcutPreset }) => {
      updateShortcuts(payload.shortcuts);
      return { success: true };
    }
  );
}

/**
 * Register IPC handler for language sync
 */
export function registerLanguageHandler(): void {
  ipcMain.handle(
    IPC_CHANNELS.LANGUAGE_UPDATE,
    (_event, payload: { language: 'en' | 'zh' }) => {
      updateLanguage(payload.language);
      return { success: true };
    }
  );
}
