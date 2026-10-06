import Image from "next/image";
import { THEME } from "@/config/themes";
import { CONTENT as C } from "@/config/content.vi";
export function SpaceUnavailable() {
  return (
    <section className="public-space-unavailable">
      <Image
        unoptimized
        src={THEME.assets.spaceUnavailable}
        width={144}
        height={144}
        alt=""
      />
      <h1>{C.publicSpace.unavailable}</h1>
      <a className="button secondary" href="/home">
        {C.nav.home}
      </a>
    </section>
  );
}
