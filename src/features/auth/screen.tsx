"use client";
import { useState, useId } from "react";
import { Heart, Eye, EyeOff } from "lucide-react";
import { db, configured, rpc } from "@/lib/supabase/browser";
import { useApp } from "@/components/app-context";
import { Select, Button, Field } from "@/components/ui";
import { ScopedForm } from "@/components/ui";
import { ThemeArt } from "@/components/theme-art";
import { CONTENT as C } from "@/config/content.vi";
import { authSchema, inviteSchema } from "@/features/schemas";
import { APP_CONFIG } from "@/config/app.config";
import { authRedirectUrl } from "@/lib/auth-redirect";
export function AuthScreen() {
  const { run, notify, recovery, setRecovery } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const fieldId = useId();
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>(
    {},
  );
  const invalid = (field: string) =>
    setInvalidFields((fields) => ({ ...fields, [field]: true }));
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
        <ThemeArt asset="envelope" size={240} />
      </div>
      <ScopedForm
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (recovery) {
            const ok = await run(async () => {
              if (password.length < 8) throw new Error("invalid");
              const { error } = await db().auth.updateUser({ password });
              if (error) throw error;
            });
            if (ok) {
              setRecovery(false);
              history.replaceState(history.state, "", "/home");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
            return;
          }
          if (!authSchema.safeParse({ email, password, name }).success) {
            notify(C.errors.invalid, true);
            return;
          }
          await run(async () => {
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
            if (signup && !result.data.session) {
              notify(C.auth.confirm);
              return false;
            }
          }, C.common.success);
        }}
      >
        <h2>
          {recovery
            ? C.auth.reset
            : signup
              ? C.redesign.signupTitle
              : C.auth.title}
        </h2>
        {!recovery && (
          <Field label={C.auth.email}>
            <input
              required
              type="email"
              autoComplete="email"
              aria-invalid={
                invalidFields.email &&
                !authSchema.shape.email.safeParse(email).success
              }
              aria-describedby={fieldId + "-email"}
              onInvalid={() => invalid("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {invalidFields.email &&
              !authSchema.shape.email.safeParse(email).success && (
                <small className="field-error" id={fieldId + "-email"}>
                  {C.errors.invalidEmail}
                </small>
              )}
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
            type={showPassword ? "text" : "password"}
            autoComplete={
              signup || recovery ? "new-password" : "current-password"
            }
            aria-invalid={invalidFields.password && password.length < 8}
            aria-describedby={fieldId + "-password"}
            onInvalid={() => invalid("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {invalidFields.password && password.length < 8 && (
            <small className="field-error" id={fieldId + "-password"}>
              {C.redesign.passwordHint}
            </small>
          )}
        </Field>
        <div className="row">
          <small>{C.redesign.passwordHint}</small>
          <button
            type="button"
            className="text-button"
            aria-pressed={showPassword}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}{" "}
            {showPassword ? C.redesign.hidePassword : C.redesign.showPassword}
          </button>
        </div>
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
      </ScopedForm>
    </section>
  );
}
export function PairScreen() {
  const { run, notify, logout } = useApp();
  const [code, setCode] = useState(""),
    [timezone, setTimezone] = useState(APP_CONFIG.timezone);
  return (
    <div className="pair-screen">
      <ThemeArt asset="mascots" size={140} />
      <h1>{C.couples.title}</h1>
      <p>{C.couples.description}</p>
      <Field label={C.couples.timezone}>
        <Select value={timezone} onValueChange={(e) => setTimezone(e)}>
          {C.couples.timezones.map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </Select>
      </Field>
      <Button
        onClick={() =>
          void run(() => rpc("pair_couple", { p_timezone: timezone }))
        }
      >
        {C.couples.create}
      </Button>
      <ScopedForm
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
      </ScopedForm>
      <button className="text-button" onClick={() => void logout()}>
        {C.auth.signOut}
      </button>
    </div>
  );
}
