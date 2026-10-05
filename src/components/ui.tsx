"use client";
import type { ReactNode, ReactElement, FormHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import {
  useEffect,
  useState,
  useRef,
  useId,
  createContext,
  useContext,
  Children,
  cloneElement,
  isValidElement,
} from "react";
import { CONTENT as C } from "@/config/content.vi";
import { useApp } from "./app-context";
import { Select } from "./select";
export { Select } from "./select";
const ActionContext = createContext<string | null>(null);
export function ActionScope({
  scope,
  children,
}: {
  scope: string;
  children: ReactNode;
}) {
  const { pendingActions } = useApp();
  return (
    <ActionContext.Provider value={scope}>
      <fieldset
        className="action-scope"
        data-action-scope={scope}
        disabled={pendingActions.includes(scope)}
        aria-busy={pendingActions.includes(scope)}
      >
        {children}
        {pendingActions.includes(scope) && (
          <p className="button-progress" role="status">
            {C.common.processing}
          </p>
        )}
      </fieldset>
    </ActionContext.Provider>
  );
}
export function ScopedForm(props: FormHTMLAttributes<HTMLFormElement>) {
  const scope = useId();
  return (
    <ActionScope scope={scope}>
      <form {...props} />
    </ActionScope>
  );
}
export function Button({
  children,
  onClick,
  secondary = false,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const { pendingActions } = useApp();
  const actionId = useId();
  const inheritedScope = useContext(ActionContext);
  const scope = inheritedScope ?? actionId;
  const pending = pendingActions.includes(scope);
  return (
    <button
      type={type}
      className={secondary ? "button secondary" : "button"}
      disabled={pending || disabled}
      data-action-id={actionId}
      aria-busy={pending}
      onClick={onClick}
    >
      {children}
      {pending && !inheritedScope && (
        <span className="button-progress" role="status">
          {C.common.processing}
        </span>
      )}
    </button>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const labelId = useId();
  return (
    <label className="field">
      <span id={labelId}>{label}</span>
      {Children.map(children, (child) =>
        isValidElement(child) &&
        (child.type === Select ||
          (typeof child.type === "string" &&
            ["input", "select", "textarea"].includes(child.type)))
          ? cloneElement(
              child as ReactElement<{ "aria-labelledby"?: string }>,
              { "aria-labelledby": labelId },
            )
          : child,
      )}
    </label>
  );
}
export function Empty({ children = C.common.empty }: { children?: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function More() {
  const { limit, setLimit } = useApp();
  return (
    <Button secondary onClick={() => setLimit(limit + 30)}>
      {C.common.more}
    </Button>
  );
}
export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function useDraft(key: string) {
  const { user, data, notify } = useApp();
  const storageKey = `couple-draft:${user?.id}:${data.couple?.id ?? "account"}:${key}`;
  const [draft, setDraft] = useState({ key: storageKey, value: "" });
  const currentKey = useRef(storageKey);
  const value = draft.key === storageKey ? draft.value : "";
  useEffect(() => {
    currentKey.current = storageKey;
    try {
      const legacyKey = `couple-draft:${user?.id}:${key}`;
      const stored =
        localStorage.getItem(storageKey) ??
        localStorage.getItem(legacyKey) ??
        "";
      if (stored && data.couple) {
        localStorage.setItem(storageKey, stored);
        localStorage.removeItem(legacyKey);
      }
      setDraft({
        key: storageKey,
        value: stored,
      });
    } catch {
      notify(C.common.draftStorageError, true);
    }
  }, [storageKey]);
  function update(text: string) {
    if (currentKey.current === storageKey)
      setDraft({ key: storageKey, value: text });
    try {
      if (text) localStorage.setItem(storageKey, text);
      else localStorage.removeItem(storageKey);
    } catch {
      notify(C.common.draftStorageError, true);
    }
  }
  useEffect(() => {
    if (!value) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [value]);
  return [value, update] as const;
}
export function Visibility({
  value,
  onChange,
  prayer = false,
}: {
  value: string;
  onChange: (v: string) => void;
  prayer?: boolean;
}) {
  return (
    <Field label={C.common.visibility}>
      <Select value={value} onValueChange={(e) => onChange(e)}>
        <option value="private">{C.common.private}</option>
        <option value={prayer ? "partner" : "couple"}>{C.common.shared}</option>
        {!prayer && <option value="partner">{C.common.partner}</option>}
      </Select>
    </Field>
  );
}
export function nameFor(id: string) {
  return id;
}
export function DateLabel({ date }: { date: string }) {
  const { data } = useApp();
  return (
    <time dateTime={date}>
      {new Date(
        date.length === 10 ? date + "T12:00:00" : date,
      ).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        ...(date.length !== 10
          ? { timeZone: data.couple?.timezone ?? "Asia/Ho_Chi_Minh" }
          : {}),
      })}
    </time>
  );
}
export function Modal({
  title,
  onClose,
  children,
  role = "dialog",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  role?: "dialog" | "alertdialog";
}) {
  const [node, setNode] = useState<HTMLDialogElement | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.body);
  }, []);
  useEffect(() => {
    if (!node || node.open) return;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [node]);
  if (!target) return null;
  return createPortal(
    <dialog
      ref={setNode}
      onCancel={onClose}
      className="modal"
      aria-label={title}
      role={role}
    >
      <div className="row-between">
        <h2>{title}</h2>
        <button className="text-button" onClick={onClose}>
          {C.common.close}
        </button>
      </div>
      {children}
    </dialog>,
    target,
  );
}
