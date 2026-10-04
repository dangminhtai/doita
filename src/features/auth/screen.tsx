"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { db, configured, rpc } from "@/lib/supabase/browser";
import { useApp } from "@/components/app-context";
import { Button, Field } from "@/components/ui";
import { CONTENT as C } from "@/config/content.vi";
import { authSchema, inviteSchema } from "@/features/schemas";
import { APP_CONFIG } from "@/config/app.config";
import { authRedirectUrl } from "@/lib/auth-redirect";
export function AuthScreen() {
  const { run, notify, recovery, setRecovery } = useApp();
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState("");
  if (!configured())
    return (
      <div className="welcome">
        <Heart size={42} />
        <h1>{C.auth.setup}</h1>
        <p>{C.auth.setupBody}</p>
      </div>
    );
  return (
    <section className="auth-wrap">
      <div className="auth-art">
        <Heart size={48} />
        <h1>{C.brand.name}</h1>
        <p>{C.auth.intro}</p>
        <div className="auth-rings" aria-hidden="true">
          ♡
        </div>
      </div>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (recovery) {
            const ok = await run(async () => {
              if (password.length < 8) throw new Error("invalid");
              const { error } = await db().auth.updateUser({ password });
              if (error) throw error;
            });
            if (ok) setRecovery(false);
            return;
          }
          if (!authSchema.safeParse({ email, password, name }).success) {
            notify(C.errors.invalid, true);
            return;
          }
          await run(
            async () => {
              const result = signup
                ? await db().auth.signUp({
                    email,
                    password,
                    options: {
                      data: { display_name: name },
                      emailRedirectTo: authRedirectUrl(location.origin),
                    },
                  })
                : await db().auth.signInWithPassword({ email, password });
              if (result.error) throw result.error;
            },
            signup ? C.auth.confirm : C.common.success,
          );
        }}
      >
        <h2>{recovery ? C.auth.reset : C.auth.title}</h2>
        {!recovery && (
          <Field label={C.auth.email}>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        )}
        {signup && !recovery && (
          <Field label={C.auth.name}>
            <input
              required
              maxLength={60}
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label={recovery ? C.auth.newPassword : C.auth.password}>
          <input
            required
            minLength={8}
            maxLength={128}
            type="password"
            autoComplete={
              signup || recovery ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit">
          {recovery ? C.auth.reset : signup ? C.auth.signUp : C.auth.signIn}
        </Button>
        {!recovery && (
          <>
            <button
              className="text-button"
              type="button"
              onClick={() => setSignup(!signup)}
            >
              {signup ? C.auth.switchSignIn : C.auth.switchSignUp}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                if (!authSchema.shape.email.safeParse(email).success) {
                  notify(C.errors.invalidEmail, true);
                  return;
                }
                void run(async () => {
                  const { error } = await db().auth.resetPasswordForEmail(
                    email,
                    { redirectTo: authRedirectUrl(location.origin) },
                  );
                  if (error) throw error;
                }, C.auth.sent);
              }}
            >
              {C.auth.forgot}
            </button>
          </>
        )}
      </form>
    </section>
  );
}
export function PairScreen() {
  const { run, notify, logout } = useApp();
  const [code, setCode] = useState("");
  return (
    <div className="pair-screen">
      <Heart size={40} />
      <h1>{C.couples.title}</h1>
      <p>{C.couples.description}</p>
      <Button
        onClick={() =>
          void run(() =>
            rpc("pair_couple", { p_timezone: APP_CONFIG.timezone }),
          )
        }
      >
        {C.couples.create}
      </Button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!inviteSchema.safeParse(code).success) {
            notify(C.errors.invite, true);
            return;
          }
          void run(async () => {
            const id = await rpc("pair_couple", { p_code: code });
            if (!id) throw new Error("invalid invite");
          }, C.couples.connected);
        }}
      >
        <Field label={C.couples.code}>
          <input
            value={code}
            maxLength={24}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            required
          />
        </Field>
        <Button secondary type="submit">
          {C.couples.join}
        </Button>
      </form>
      <button className="text-button" onClick={() => void logout()}>
        {C.auth.signOut}
      </button>
    </div>
  );
}
