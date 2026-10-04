"use client";
import type { ReactNode } from "react";
import { useEffect, useState, useRef } from "react";
import { CONTENT as C } from "@/config/content.vi";
import { useApp } from "./app-context";
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
  const { busy } = useApp();
  return (
    <button
      type={type}
      className={secondary ? "button secondary" : "button"}
      disabled={busy || disabled}
      onClick={onClick}
    >
      {children}
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
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Empty() {
  return <p className="empty">{C.common.empty}</p>;
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
  const { user } = useApp();
  const storageKey = `couple-draft:${user?.id}:${key}`;
  const [draft, setDraft] = useState({ key: storageKey, value: "" });
  const currentKey = useRef(storageKey);
  const value = draft.key === storageKey ? draft.value : "";
  useEffect(() => {
    currentKey.current = storageKey;
    try {
      setDraft({
        key: storageKey,
        value: localStorage.getItem(storageKey) ?? "",
      });
    } catch {}
  }, [storageKey]);
  function update(text: string) {
    if (currentKey.current === storageKey)
      setDraft({ key: storageKey, value: text });
    try {
      if (text) localStorage.setItem(storageKey, text);
      else localStorage.removeItem(storageKey);
    } catch {}
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
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="private">{C.common.private}</option>
        <option value={prayer ? "partner" : "couple"}>{C.common.shared}</option>
        {!prayer && <option value="partner">{C.common.partner}</option>}
      </select>
    </Field>
  );
}
export function nameFor(id: string) {
  return id;
}
export function DateLabel({ date }: { date: string }) {
  return (
    <time dateTime={date}>
      {new Date(
        date.length === 10 ? date + "T12:00:00" : date,
      ).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </time>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [node, setNode] = useState<HTMLDialogElement | null>(null);
  useEffect(() => {
    if (node && !node.open) node.showModal();
  }, [node]);
  return (
    <dialog
      ref={setNode}
      onCancel={onClose}
      className="modal"
      aria-label={title}
    >
      <div className="row-between">
        <h2>{title}</h2>
        <button className="text-button" onClick={onClose}>
          {C.common.close}
        </button>
      </div>
      {children}
    </dialog>
  );
}
