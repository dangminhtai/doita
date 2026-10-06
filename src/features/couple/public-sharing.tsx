"use client";
import { useApp } from "@/components/app-context";
import { Button } from "@/components/ui";
import { Link, Copy, Check } from "@/components/icons";
import { CONTENT as C } from "@/config/content.vi";
import { rpc } from "@/lib/supabase/browser";

export function PublicSharing() {
  const { user, data, run, notify } = useApp();
  const self = data.members.find((member) => member.user_id === user?.id);
  const consented = self?.public_profile_consent === true;
  const visible =
    data.members.length > 0 &&
    data.members.length <= 2 &&
    data.members.every((member) => member.public_profile_consent === true);
  const path = `/p/${data.couple?.public_id}`;
  return (
    <section className="public-sharing">
      <h3>
        <Link size={22} />
        {C.publicSpace.title}
      </h3>
      <p role="status">
        {visible
          ? C.publicSpace.on
          : consented
            ? C.publicSpace.waiting
            : C.publicSpace.off}
      </p>
      <div className="row">
        {!consented ? (
          <Button
            onClick={() =>
              void run(() => rpc("set_public_consent", { p_enabled: true }))
            }
          >
            <Check size={20} />
            {C.publicSpace.enable}
          </Button>
        ) : (
          <Button
            secondary
            onClick={() =>
              void run(() => rpc("set_public_consent", { p_enabled: false }))
            }
          >
            {C.publicSpace.disable}
          </Button>
        )}
        {data.couple?.public_id && (
          <>
            <Button
              secondary
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    new URL(path, location.origin).href,
                  );
                  notify(C.redesign.copied);
                } catch {
                  notify(C.errors.generic, true);
                }
              }}
            >
              <Copy size={20} />
              {C.publicSpace.copy}
            </Button>
            {visible && (
              <a className="text-button" href={path}>
                {C.publicSpace.view}
              </a>
            )}
          </>
        )}
      </div>
    </section>
  );
}
