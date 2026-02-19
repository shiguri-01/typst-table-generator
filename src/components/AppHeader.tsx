import { IconBrandGithub } from "@tabler/icons-solidjs";
import { Link } from "@tanstack/solid-router";
import { buttonStyles } from "./ui/button";

export function AppHeader() {
  return (
    <header class="border-b border-border bg-bg/95 backdrop-blur">
      <div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" class="text-sm font-semibold tracking-tight">
          Typst Table Generator
        </Link>
        <a
          href="https://github.com/shiguri-01/typst-table-generator"
          target="_blank"
          rel="noreferrer"
          class={buttonStyles({ intent: "plain", size: "sq-sm" })}
          aria-label="GitHub Repository"
        >
          <IconBrandGithub class="h-5 w-5" />
        </a>
      </div>
    </header>
  );
}
