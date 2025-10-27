"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TableEditorShellProps {
  toolbar: React.ReactNode;
  caption: React.ReactNode;
  grid: React.ReactNode;
  inspector: React.ReactNode;
  exportPanel: React.ReactNode;
}

const DESKTOP_BREAKPOINT = "(min-width: 960px)";

export function TableEditorShell({
  toolbar,
  caption,
  grid,
  inspector,
  exportPanel,
}: TableEditorShellProps) {
  const isDesktop = useMediaQuery(DESKTOP_BREAKPOINT) ?? false;
  const [isInspectorOpen, setInspectorOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setInspectorOpen(false);
    }
  }, [isDesktop]);

  const inspectorPanel = (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-border/60 bg-overlay/40 p-4">
      {inspector}
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div>{toolbar}</div>
      <div>{caption}</div>
      {!isDesktop && (
        <div className="flex justify-end">
          <Drawer isOpen={isInspectorOpen} onOpenChange={setInspectorOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" intent="outline">
                Open inspector
              </Button>
            </DrawerTrigger>
            <DrawerContent side="bottom" notch className="pb-4">
              <DrawerHeader className="pb-2">
                <DrawerTitle>Inspector</DrawerTitle>
              </DrawerHeader>
              <DrawerBody className="space-y-4">{inspector}</DrawerBody>
            </DrawerContent>
          </Drawer>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60 bg-background">
          {grid}
        </div>
        {isDesktop && (
          <aside className="w-80 shrink-0 lg:h-full">{inspectorPanel}</aside>
        )}
      </div>
      <div>{exportPanel}</div>
    </div>
  );
}
