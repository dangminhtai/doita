"use client";
import { CONTENT as C } from "@/config/content.vi";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="welcome">
      <h1>{C.errors.generic}</h1>
      <button onClick={reset}>{C.common.retry}</button>
    </main>
  );
}
