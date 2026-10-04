import { CONTENT as C } from "@/config/content.vi";
export default function Offline() {
  return (
    <main className="welcome">
      <h1>{C.brand.name}</h1>
      <p>{C.errors.offline}</p>
      <a href="/home">{C.common.retry}</a>
    </main>
  );
}
