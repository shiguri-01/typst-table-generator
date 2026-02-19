import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/solid-router";
import { AppHeader } from "@/components/AppHeader";
import { Container } from "@/components/ui/container";
import { HomePage } from "@/pages/HomePage";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <AppHeader />
      <Container class="py-6">
        <Outlet />
      </Container>
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}
