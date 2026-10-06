import type { ReactNode } from "react";
import { Heart } from "@/components/icons";
import { CONTENT as C } from "@/config/content.vi";
export function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="public-space-page">
      <a className="skip-link" href="#public-space-content">
        {C.redesign.skipContent}
      </a>
      <header className="public-space-header">
        <a href="/home">
          <Heart size={32} />
          <span>{C.brand.name}</span>
        </a>
      </header>
      <main id="public-space-content" className="public-space-main">
        {children}
      </main>
    </div>
  );
}
