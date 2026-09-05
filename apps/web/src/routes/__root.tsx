import { Toaster } from "@mom/ui/components/sonner";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";

import appCss from "../index.css?url";
import fontsCss from "@mom/ui/fonts.css?url";
import { TooltipProvider } from "@mom/ui/components/tooltip";
import { QueryProvider } from "@/components/query-provider";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Pendataan sampah organik",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: fontsCss,
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          <QueryProvider>
            <Outlet />
          </QueryProvider>
          <Toaster richColors />
          <Scripts />
        </TooltipProvider>
      </body>
    </html>
  );
}
