import { IconBrandGithub } from "@tabler/icons-react";
import { buttonStyles } from "./ui/button";
import { ExternalLink, Link } from "./ui/link";
import {
  Navbar,
  NavbarMobile,
  NavbarProvider,
  NavbarSection,
  NavbarSpacer,
  NavbarStart,
  NavbarTrigger,
} from "./ui/navbar";

export function AppHeader() {
  return (
    <NavbarProvider>
      {/* Desktop */}
      <Navbar>
        <NavbarStart>
          <Link to="/" className="font-medium">
            Typst Table Generator
          </Link>
        </NavbarStart>
        <NavbarSpacer />
        <NavbarSection>
          <ExternalLink
            href="https://github.com/shiguri-01/typst-table-generator"
            className={buttonStyles({ intent: "plain", size: "sq-sm" })}
            aria-label="GitHub Repository"
          >
            <IconBrandGithub className="size-5" />
          </ExternalLink>
        </NavbarSection>
      </Navbar>

      {/* Mobile */}
      <NavbarMobile>
        <NavbarTrigger />
        <NavbarStart>
          <Link to="/" className="font-medium">
            Typst Table Generator
          </Link>
        </NavbarStart>
      </NavbarMobile>
    </NavbarProvider>
  );
}
