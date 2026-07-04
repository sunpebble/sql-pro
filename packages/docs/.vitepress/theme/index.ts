import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './brand.css';

export default {
  extends: DefaultTheme,
} satisfies Theme;
