import {
  type NavigateOptions,
  type ToOptions,
  useRouter,
} from "@tanstack/react-router";
import { RouterProvider as RouterProviderPrimitive } from "react-aria-components";

declare module "react-aria-components" {
  interface RouterConfig {
    href: ToOptions["to"] | string;
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <RouterProviderPrimitive
      navigate={(to, options) => router.navigate({ to, ...options })}
    >
      {children}
    </RouterProviderPrimitive>
  );
}
