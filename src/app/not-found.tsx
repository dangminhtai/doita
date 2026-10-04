import Link from "next/link";
import { CONTENT as C } from "@/config/content.vi";
export default function NotFound() {
  return (
    <main className="welcome">
      <h1>{C.errors.notFound}</h1>
      <Link href="/">{C.common.back}</Link>
    </main>
  );
}
