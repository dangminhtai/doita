"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { z } from "zod";
import { useApp } from "@/components/app-context";
import { ProfileAvatar } from "@/components/theme-art";
import {
  Button,
  Field,
  Modal,
  PageTitle,
  Select,
  ScopedForm,
} from "@/components/ui";
import { useConfirmation } from "@/components/confirmation";
import { CONTENT as C, interpolate as t } from "@/config/content.vi";
import { authenticatedFetch, db } from "@/lib/supabase/browser";
import { authRedirectUrl } from "@/lib/auth-redirect";
import { AvatarCrop } from "./avatar-crop";
import { ProfileNotifications } from "./notifications";

const draftSchema = z.object({
  name: z.string().max(60),
  gender: z.enum(["male", "female", "other", "undisclosed"]).nullable(),
  resurface: z.boolean(),
  avatarMode: z.enum(["keep", "default", "new"]),
  picture: z.string().max(120000).nullable(),
  requestId: z.uuid(),
});
type Draft = z.infer<typeof draftSchema>;
function pictureUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export function ProfileScreen({ go }: { go: (path: string) => void }) {
  const { user, data, run, load, notify, logout } = useApp();
  const ask = useConfirmation();
  const profile = data.profiles.find((p) => p.id === user!.id);
  const key = `couple-draft:${user!.id}:account:profile`;
  const initial: Draft = {
    name: profile?.display_name ?? "",
    gender: profile?.gender ?? null,
    resurface: profile?.resurfacing ?? true,
    avatarMode: "keep",
    picture: null,
    requestId: crypto.randomUUID(),
  };
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      return draftSchema.parse(JSON.parse(localStorage.getItem(key) ?? "null"));
    } catch {
      return initial;
    }
  });
  const [crop, setCrop] = useState<File | null>(null),
    [locked, setLocked] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const active = useRef(true),
    saving = useRef(false);
  const cropRevision = useRef(0);
  const savedRevision = useRef(Date.parse(profile?.updated_at ?? "") || 0);
  const dirty =
    draft.name !== saved.name ||
    draft.gender !== saved.gender ||
    draft.resurface !== saved.resurface ||
    draft.avatarMode !== "keep";
  const persist = (next: Draft) => {
    setDraft(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      notify(C.common.draftStorageError, true);
    }
  };
  const change = (fields: Partial<Draft>) =>
    persist({ ...draft, ...fields, requestId: crypto.randomUUID() });
  useEffect(() => {
    const revision = Date.parse(profile?.updated_at ?? "");
    if (
      dirty ||
      !Number.isFinite(revision) ||
      revision <= savedRevision.current
    )
      return;
    savedRevision.current = revision;
    const next: Draft = {
      name: profile?.display_name ?? "",
      gender: profile?.gender ?? null,
      resurface: profile?.resurfacing ?? true,
      avatarMode: "keep",
      picture: null,
      requestId: crypto.randomUUID(),
    };
    setSaved(next);
    setDraft(next);
  }, [
    dirty,
    profile?.updated_at,
    profile?.display_name,
    profile?.gender,
    profile?.resurfacing,
  ]);
  useEffect(() => {
    active.current = true;
    void authenticatedFetch("/api/assets/cleanup", { method: "POST" }).catch(
      () => {},
    );
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: Event) => {
      event.preventDefault();
      if (saving.current) return;
      void ask(C.common.unsaved, { action: C.common.continue }).then((ok) => {
        if (ok) (event as CustomEvent<{ resume: () => void }>).detail.resume();
      });
    };
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("couple-before-navigate", guard);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("couple-before-navigate", guard);
      window.removeEventListener("beforeunload", unload);
    };
  }, [dirty, ask]);
  return (
    <>
      <PageTitle title={C.profile.title} />
      <div className="profile-page">
        <ScopedForm
          className="profile-form"
          showProgress={false}
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            if (saving.current) return;
            if (!draft.name.trim() || draft.name.trim().length > 60) {
              setNameError(C.profile.nameError);
              return;
            }
            if (
              draft.gender !== saved.gender &&
              !data.couple &&
              !(await ask(
                t(C.profile.genderConfirm, {
                  gender: C.profile.genders[draft.gender ?? "unset"],
                }),
              ))
            )
              return;
            saving.current = true;
            setIsSaving(true);
            try {
              await run(async () => {
                const body = new FormData();
                body.set(
                  "profile",
                  JSON.stringify({
                    requestId: draft.requestId,
                    name: draft.name.trim(),
                    gender: data.couple
                      ? (profile?.gender ?? null)
                      : draft.gender,
                    resurface: draft.resurface,
                    avatarMode: draft.avatarMode,
                  }),
                );
                if (draft.avatarMode === "new" && draft.picture) {
                  const picture = await (await fetch(draft.picture)).blob();
                  body.set("avatar", picture, "avatar.webp");
                }
                let result;
                try {
                  result = await authenticatedFetch("/api/profile", {
                    method: "POST",
                    body,
                  });
                } catch (error) {
                  if (
                    active.current &&
                    error instanceof Error &&
                    error.message === "request_conflict"
                  )
                    persist({ ...draft, requestId: crypto.randomUUID() });
                  if (
                    active.current &&
                    error instanceof Error &&
                    error.message === "gender_locked"
                  ) {
                    setLocked(true);
                    await load();
                    return false;
                  }
                  throw error;
                }
                if (!active.current) return;
                savedRevision.current =
                  Date.parse(result.profile.updated_at ?? "") ||
                  savedRevision.current;
                const next: Draft = {
                  ...draft,
                  name: result.profile.display_name,
                  gender: result.profile.gender ?? null,
                  resurface: result.profile.resurfacing,
                  avatarMode: "keep",
                  picture: null,
                  requestId: crypto.randomUUID(),
                };
                setSaved(next);
                setDraft(next);
                try {
                  localStorage.removeItem(key);
                } catch {
                  notify(C.common.draftStorageError, true);
                }
              }, C.profile.saved);
            } finally {
              saving.current = false;
              if (active.current) setIsSaving(false);
            }
          }}
        >
          <fieldset
            className="profile-fields"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            <div className="profile-photo">
              {draft.picture ? (
                <Image
                  unoptimized
                  src={draft.picture}
                  width={88}
                  height={88}
                  alt=""
                  className="member-avatar"
                />
              ) : (
                <ProfileAvatar
                  userId={user!.id}
                  size={88}
                  defaultOnly={draft.avatarMode === "default"}
                />
              )}
              <div>
                <label className="button secondary avatar-upload">
                  {C.profile.changeImage}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label={C.profile.changeImage}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      if (
                        !["image/jpeg", "image/png", "image/webp"].includes(
                          file.type,
                        )
                      ) {
                        notify(C.profile.imageError, true);
                        return;
                      }
                      cropRevision.current++;
                      setCrop(file);
                    }}
                  />
                </label>
                {(profile?.avatar_path || draft.picture) && (
                  <Button
                    secondary
                    onClick={() =>
                      change({ picture: null, avatarMode: "default" })
                    }
                  >
                    {C.profile.defaultImage}
                  </Button>
                )}
              </div>
            </div>
            <Field label={C.profile.name}>
              <input
                value={draft.name}
                maxLength={60}
                required
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "profile-name-error" : undefined}
                onChange={(event) => {
                  change({ name: event.target.value });
                  setNameError("");
                }}
              />
            </Field>
            {nameError && (
              <p id="profile-name-error" role="alert" className="field-error">
                {nameError}
              </p>
            )}
            <Field label={C.profile.gender}>
              {data.couple ? (
                <Button secondary onClick={() => setLocked(true)}>
                  {
                    C.profile.genders[
                      (profile?.gender ??
                        "unset") as keyof typeof C.profile.genders
                    ]
                  }
                </Button>
              ) : (
                <Select
                  value={draft.gender ?? "unset"}
                  onValueChange={(value) =>
                    change({
                      gender:
                        value === "unset" ? null : (value as Draft["gender"]),
                    })
                  }
                >
                  {Object.entries(C.profile.genders).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={draft.resurface}
                onChange={(event) =>
                  change({ resurface: event.target.checked })
                }
              />
              {C.settings.resurface}
            </label>
            <Button type="submit" disabled={!dirty || isSaving}>
              {isSaving ? C.common.processing : C.common.save}
            </Button>
          </fieldset>
        </ScopedForm>
        <ProfileNotifications />
        <section className="profile-account">
          <h2>{C.redesign.account}</h2>
          <Field label={C.profile.email}>
            <input readOnly value={user?.email ?? ""} />
          </Field>
          <div className="row">
            <Button
              secondary
              disabled={!user?.email}
              onClick={() =>
                void run(async () => {
                  const result = await db().auth.resetPasswordForEmail(
                    user!.email!,
                    { redirectTo: authRedirectUrl(location.origin) },
                  );
                  if (result.error) throw result.error;
                }, C.auth.confirm)
              }
            >
              {C.profile.password}
            </Button>
            <Button secondary onClick={() => void logout()}>
              {C.auth.signOut}
            </Button>
          </div>
          <div className="danger-zone">
            <button
              onClick={async () => {
                if (
                  await ask(C.settings.confirmAccount, {
                    title: C.settings.deleteAccount,
                    action: C.settings.deleteAccount,
                    destructive: true,
                  })
                )
                  void run(async () => {
                    await authenticatedFetch("/api/account", {
                      method: "DELETE",
                    });
                    await logout();
                  });
              }}
            >
              {C.settings.deleteAccount}
            </button>
          </div>
        </section>
      </div>
      {crop && (
        <AvatarCrop
          file={crop}
          onClose={() => {
            cropRevision.current++;
            setCrop(null);
          }}
          onDone={(blob) => {
            const revision = cropRevision.current;
            void pictureUrl(blob)
              .then((picture) => {
                if (active.current && revision === cropRevision.current) {
                  change({ picture, avatarMode: "new" });
                  setCrop(null);
                }
              })
              .catch(() => {
                if (active.current && revision === cropRevision.current)
                  notify(C.profile.imageError, true);
              });
          }}
        />
      )}
      {locked && (
        <Modal
          title={C.profile.lockedTitle}
          onClose={() => setLocked(false)}
          role="alertdialog"
        >
          <p>{C.profile.locked}</p>
          <div className="row">
            <Button secondary onClick={() => setLocked(false)}>
              {C.common.close}
            </Button>
            <Button
              onClick={() => {
                setLocked(false);
                go("couple?panel=account");
              }}
            >
              {C.profile.manage}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
