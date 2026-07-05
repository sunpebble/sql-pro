/**
 * Screenshot capture script for Quarry marketing materials
 * Usage: pnpm run screenshots
 * Requires: pnpm run build (builds the Electron app first)
 */

import type { ElectronApplication, Page } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import { _electron as electron } from 'playwright';

const SCREENSHOT_WIDTH = 1440;
const SCREENSHOT_HEIGHT = 900;
const OUTPUT_DIR = path.join(__dirname, '../screenshots-output');
const DEMO_DB_PATH = path.resolve(__dirname, '../../../artifacts/demo.db');

const TARGET_DIRS = [
  path.join(__dirname, '../../video/public/screenshots'),
  path.join(__dirname, '../../../packages/docs/public/screenshots'),
  path.join(__dirname, '../../../packages/docs/.vitepress/public/screenshots'),
];

const SET_LIGHT_MODE_SCRIPT = `
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  document.documentElement.style.colorScheme = 'light';
  // Also update Monaco editor theme if available
  if (window.monaco?.editor) {
    window.monaco.editor.setTheme('quarry-light');
  }
`;

const SET_DARK_MODE_SCRIPT = `
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
  document.documentElement.style.colorScheme = 'dark';
  // Also update Monaco editor theme if available
  if (window.monaco?.editor) {
    window.monaco.editor.setTheme('quarry-dark');
  }
`;

async function captureWithTheme(
  page: Page,
  name: string,
  description: string
): Promise<void> {
  console.log(`Capturing: ${name} - ${description}`);

  // Ensure dark mode is properly set (including Monaco editor theme)
  await page.evaluate(SET_DARK_MODE_SCRIPT);
  await page.waitForTimeout(300);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${name}-dark.png`),
    type: 'png',
  });

  try {
    await page.evaluate(SET_LIGHT_MODE_SCRIPT);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${name}.png`),
      type: 'png',
    });

    await page.evaluate(SET_DARK_MODE_SCRIPT);
    await page.waitForTimeout(300);
  } catch (error) {
    console.warn(`Could not capture light mode for ${name}:`, error);
  }
}

async function openDemoDatabase(page: Page): Promise<boolean> {
  console.log(`Opening demo database: ${DEMO_DB_PATH}`);

  if (!fs.existsSync(DEMO_DB_PATH)) {
    console.error(`Demo database not found at ${DEMO_DB_PATH}`);
    return false;
  }

  try {
    const dbPath = DEMO_DB_PATH.replace(/\\/g, '\\\\');
    const filename = path.basename(DEMO_DB_PATH);

    // Dispatch the open-database-file event to trigger the dialog
    const triggerOpenEvent = `
      window.dispatchEvent(new CustomEvent('open-database-file', {
        detail: {
          filePath: '${dbPath}',
          filename: '${filename}',
          isEncrypted: false
        }
      }));
    `;

    await page.evaluate(triggerOpenEvent);
    console.log('Dispatched open-database-file event');
    await page.waitForTimeout(1500);

    // Check for dialog and submit the form directly via JavaScript
    const dialogExists = await page.$('[role="dialog"]');
    if (dialogExists) {
      console.log('Connection dialog detected');

      // Submit the form directly via JavaScript to bypass overlay click issues
      const formSubmitted = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;

        // Find the form inside the dialog
        const form = dialog.querySelector('form');
        if (form) {
          // Find the submit button and check if it's enabled
          const submitBtn = form.querySelector(
            'button[type="submit"]'
          ) as HTMLButtonElement | null;
          if (submitBtn && !submitBtn.disabled) {
            // Dispatch submit event on the form
            const submitEvent = new Event('submit', {
              bubbles: true,
              cancelable: true,
            });
            form.dispatchEvent(submitEvent);

            // Also try clicking the button programmatically
            submitBtn.click();
            return true;
          }
        }

        // Fallback: try to find any button that looks like a connect/save button
        const buttons = dialog.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent?.toLowerCase() || '';
          if (
            (text.includes('connect') ||
              text.includes('save') ||
              text.includes('open')) &&
            !btn.disabled
          ) {
            btn.click();
            return true;
          }
        }

        return false;
      });

      if (formSubmitted) {
        console.log('Form submitted programmatically');
        await page.waitForTimeout(3000);
      } else {
        console.log('Could not submit form, trying Enter key...');
        // Focus the dialog first
        await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (dialog) {
            const input = dialog.querySelector('input');
            if (input) input.focus();
          }
        });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
      }
    }

    // Check if we successfully navigated to the database view
    try {
      await page.waitForSelector('aside, [class*="Sidebar"]', {
        timeout: 8000,
      });
      console.log('Database view detected!');
      return true;
    } catch {
      console.log('Checking if we navigated...');
      const url = page.url();
      console.log('Current URL:', url);

      if (url.includes('/database')) {
        console.log('On database route');
        await page.waitForTimeout(2000);
        return true;
      }

      // One more fallback: check if dialog closed and try again
      const stillHasDialog = await page.$('[role="dialog"]');
      if (!stillHasDialog) {
        console.log('Dialog closed but not on database route - checking state');
        await page.waitForTimeout(2000);
        const finalUrl = page.url();
        if (finalUrl.includes('/database')) {
          return true;
        }
      }

      return false;
    }
  } catch (error) {
    console.error('Error opening database:', error);
    return false;
  }
}

async function dismissDialogs(page: Page): Promise<void> {
  const dialogs = await page.$$('[role="dialog"]');
  if (dialogs.length > 0) {
    console.log(`Found ${dialogs.length} open dialog(s), dismissing...`);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(500);
    const remainingDialogs = await page.$$('[role="dialog"]');
    if (remainingDialogs.length > 0) {
      console.log(
        `${remainingDialogs.length} dialog(s) still open after Escape`
      );
      await page.evaluate(() => {
        const overlays = document.querySelectorAll(
          '[data-slot="dialog-overlay"]'
        );
        overlays.forEach((overlay) => {
          (overlay as HTMLElement).style.display = 'none';
        });
        const dialogs = document.querySelectorAll('[role="dialog"]');
        dialogs.forEach((dialog) => {
          (dialog as HTMLElement).style.display = 'none';
        });
      });
    }
  }
}

async function clickFirstTable(page: Page): Promise<boolean> {
  console.log('Looking for tables in sidebar...');
  try {
    await dismissDialogs(page);
    await page.waitForTimeout(1000);

    const tableButtons = await page.$$('button');
    for (const btn of tableButtons) {
      const text = await btn.textContent();
      if (
        text &&
        /^(?:users|products|orders|customers|categories|items)/i.test(
          text.trim()
        )
      ) {
        console.log(`Found table: ${text.trim()}`);
        await btn.click({ force: true });
        await page.waitForTimeout(1500);
        return true;
      }
    }

    const sidebarBtns = await page.$$('aside button');
    if (sidebarBtns.length > 0) {
      const text = await sidebarBtns[0].textContent();
      console.log(
        `Clicking first sidebar button: ${text?.trim() || 'unknown'}`
      );
      await sidebarBtns[0].click({ force: true });
      await page.waitForTimeout(1500);
      return true;
    }

    console.warn('No table buttons found');
    return false;
  } catch (error) {
    console.error('Error clicking table:', error);
    return false;
  }
}

async function openQueryEditor(page: Page): Promise<boolean> {
  console.log('Opening query editor...');
  try {
    await dismissDialogs(page);

    // Navigate to Query view via activity bar - look for the Code icon button
    const queryViewOpened = await page.evaluate(() => {
      // Find activity bar buttons and click the one for query editor
      // The query view has data-tour-target="query-editor-tab" or contains Code icon
      const activityBar = document.querySelector('nav') || document.body;
      const buttons = activityBar.querySelectorAll('button');
      for (const btn of buttons) {
        const tourTarget = btn.getAttribute('data-tour-target');
        if (tourTarget === 'query-editor-tab') {
          btn.click();
          return true;
        }
        // Fallback: look for button with svg that has Code-like path
        const svg = btn.querySelector('svg');
        if (svg) {
          const paths = svg.querySelectorAll('path');
          for (const path of paths) {
            const d = path.getAttribute('d');
            // Code icon pattern from lucide - look for angle brackets pattern
            if (d && d.includes('m18 16')) {
              btn.click();
              return true;
            }
          }
        }
      }
      return false;
    });

    if (queryViewOpened) {
      console.log('Switched to query view');
    } else {
      // Fallback: try keyboard shortcut
      console.log('Trying keyboard shortcut for query view...');
      await page.keyboard.press('Meta+2');
    }

    // Wait for Monaco editor to mount (lazy-loaded, can take a few seconds)
    let monaco: Awaited<ReturnType<typeof page.$>> = null;
    try {
      monaco = await page.waitForSelector('.monaco-editor', { timeout: 10000 });
      console.log('Monaco editor mounted');
      await page.waitForTimeout(500);
    } catch {
      console.log('Monaco editor did not appear within timeout');
    }
    if (!monaco) {
      // Try clicking "New Query" button or similar
      const newQueryClicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          if (
            text.includes('new query') ||
            text.includes('new tab') ||
            ariaLabel.includes('new query') ||
            ariaLabel.includes('add tab')
          ) {
            btn.click();
            return true;
          }
          // Look for Plus icon in query tab bar
          const svg = btn.querySelector('svg');
          if (svg && btn.closest('[class*="TabBar"], [class*="tabs"]')) {
            const paths = svg.querySelectorAll('path');
            for (const path of paths) {
              const d = path.getAttribute('d');
              if (d && d.includes('M5 12h14')) {
                btn.click();
                return true;
              }
            }
          }
        }
        return false;
      });

      if (newQueryClicked) {
        console.log('Clicked new query button');
        try {
          monaco = await page.waitForSelector('.monaco-editor', {
            timeout: 10000,
          });
          console.log('Monaco editor mounted after new query');
          await page.waitForTimeout(500);
        } catch {
          console.log('Monaco editor still not found after new query');
        }
      } else {
        monaco = await page.$('.monaco-editor');
      }
    }

    if (monaco) {
      console.log('Monaco editor found, setting query via Monaco API...');
      await monaco.click({ force: true });
      await page.waitForTimeout(500);

      // Use Monaco API to set content directly - more reliable than keyboard input
      const query = 'SELECT * FROM sqlite_master LIMIT 10;';
      const contentSet = await page.evaluate((queryText) => {
        // Find Monaco editor instance
        const editorElement = document.querySelector('.monaco-editor');
        if (!editorElement) return { success: false, method: 'none' };

        // Try multiple ways to access Monaco
        // Method 1: window.monaco (if exposed globally)
        const monacoWindow = window as typeof window & {
          monaco?: {
            editor: {
              getEditors: () => Array<{
                setValue: (value: string) => void;
                getValue: () => string;
              }>;
              setTheme: (theme: string) => void;
            };
          };
        };

        if (monacoWindow.monaco?.editor) {
          monacoWindow.monaco.editor.setTheme('quarry-dark');
          const editors = monacoWindow.monaco.editor.getEditors();
          if (editors.length > 0) {
            editors[0].setValue(queryText);
            return { success: true, method: 'window.monaco' };
          }
        }

        // Method 2: Try to find monaco instance via require (AMD loader)
        const requireWindow = window as typeof window & {
          require?: (
            modules: string[],
            callback: (monaco: unknown) => void
          ) => void;
        };

        if (requireWindow.require) {
          return new Promise<{ success: boolean; method: string }>(
            (resolve) => {
              requireWindow.require!(
                ['vs/editor/editor.main'],
                (monacoModule: {
                  editor: {
                    getEditors: () => Array<{ setValue: (v: string) => void }>;
                    setTheme: (theme: string) => void;
                  };
                }) => {
                  if (monacoModule?.editor) {
                    monacoModule.editor.setTheme('quarry-dark');
                    const editors = monacoModule.editor.getEditors();
                    if (editors.length > 0) {
                      editors[0].setValue(queryText);
                      resolve({ success: true, method: 'require' });
                      return;
                    }
                  }
                  resolve({ success: false, method: 'require-failed' });
                }
              );
            }
          );
        }

        // Method 3: Fallback to textarea manipulation
        const textArea = document.querySelector('.monaco-editor textarea');
        if (textArea) {
          (textArea as HTMLTextAreaElement).focus();
          document.execCommand('selectAll', false);
          document.execCommand('insertText', false, queryText);
          return { success: true, method: 'textarea' };
        }

        return { success: false, method: 'none' };
      }, query);

      const result = await contentSet;
      console.log(`Query set result: ${JSON.stringify(result)}`);

      // Wait for theme to apply
      await page.waitForTimeout(500);

      if (!result.success) {
        console.log('Falling back to keyboard input');
        await page.keyboard.press('Meta+a');
        await page.waitForTimeout(200);
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(300);
        // Type with extra leading space to avoid first char being lost
        await page.keyboard.type(` ${query}`, { delay: 30 });
        await page.waitForTimeout(200);
        // Go to start and delete the extra space
        await page.keyboard.press('Meta+Home');
        await page.waitForTimeout(100);
        await page.keyboard.press('Delete');
      }

      await page.waitForTimeout(800);

      console.log('Executing query...');
      await page.keyboard.press('Meta+Enter');
      await page.waitForTimeout(2500);
      return true;
    }

    console.warn('Monaco editor not found');
    return false;
  } catch (error) {
    console.error('Error opening query editor:', error);
    return false;
  }
}

function distributeScreenshots(): void {
  console.log('\nDistributing screenshots to target directories...');

  const screenshots = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith('.png'));

  for (const targetDir of TARGET_DIRS) {
    if (!fs.existsSync(targetDir)) {
      console.log(`Creating directory: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }

    for (const screenshot of screenshots) {
      const src = path.join(OUTPUT_DIR, screenshot);
      const dest = path.join(targetDir, screenshot);
      fs.copyFileSync(src, dest);
      console.log(
        `  Copied ${screenshot} -> ${path.relative(process.cwd(), dest)}`
      );
    }
  }
}

async function main(): Promise<void> {
  console.log('Quarry Screenshot Capture Tool\n');

  if (fs.existsSync(OUTPUT_DIR)) {
    for (const file of fs.readdirSync(OUTPUT_DIR)) {
      if (file.endsWith('.png')) {
        fs.unlinkSync(path.join(OUTPUT_DIR, file));
      }
    }
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const mainPath = path.join(__dirname, '../out/main/index.js');

  if (!fs.existsSync(mainPath)) {
    console.error(`Error: Built main process not found at ${mainPath}`);
    console.error('Please run "pnpm run build" first.');
    process.exit(1);
  }

  let electronApp: ElectronApplication | null = null;

  try {
    console.log('Launching Electron app...');

    electronApp = await electron.launch({
      args: [mainPath],
      env: {
        ...process.env,
        ELECTRON_DISABLE_GPU: '1',
      },
    });

    const window = await electronApp.firstWindow();

    await electronApp.evaluate(
      async ({ BrowserWindow }, { width, height }) => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          win.setSize(width, height);
          win.center();
        }
      },
      { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT }
    );

    await window.waitForLoadState('networkidle');
    console.log(`Window: ${await window.title()}`);
    await window.waitForTimeout(2000);

    await captureWithTheme(window, 'welcome', 'Welcome screen');

    const dbOpened = await openDemoDatabase(window);

    if (dbOpened) {
      await window.waitForTimeout(1000);
      await captureWithTheme(
        window,
        'database',
        'Database sidebar with tables'
      );

      const tableClicked = await clickFirstTable(window);
      if (tableClicked) {
        await captureWithTheme(window, 'table', 'Table data view');
      }

      const queryOpened = await openQueryEditor(window);
      if (queryOpened) {
        await captureWithTheme(window, 'query', 'Query editor with results');
      }
    } else {
      console.log('Skipping database views - could not open demo database');
    }

    distributeScreenshots();
    console.log('\nDone!');
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    process.exit(1);
  } finally {
    if (electronApp) {
      await electronApp.close();
    }
  }
}

main().catch(console.error);
