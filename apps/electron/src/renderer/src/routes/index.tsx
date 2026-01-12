import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import { useConnectionStore } from '@/stores';
import { RouterErrorFallback } from './error';
import { RootLayout } from './root';

// Use hash history for Electron file:// protocol compatibility
const hashHistory = createHashHistory();

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: RouterErrorFallback,
});

// Welcome route (index) - shown when not connected
const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./welcome'), 'WelcomePage'),
  beforeLoad: () => {
    const { connection } = useConnectionStore.getState();
    if (connection) {
      throw redirect({ to: '/database' });
    }
  },
});

// Database route - shown when connected
const databaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/database',
  component: lazyRouteComponent(() => import('./database'), 'DatabasePage'),
  beforeLoad: () => {
    const { connection } = useConnectionStore.getState();
    if (!connection) {
      throw redirect({ to: '/' });
    }
  },
});

// Plugins route - plugin management and marketplace
const pluginsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plugins',
  component: lazyRouteComponent(() => import('./plugins'), 'PluginsPage'),
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  welcomeRoute,
  databaseRoute,
  pluginsRoute,
]);

// Create and export the router with hash history for Electron compatibility
export const router = createRouter({
  routeTree,
  history: hashHistory,
  defaultPreload: 'intent',
});

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
