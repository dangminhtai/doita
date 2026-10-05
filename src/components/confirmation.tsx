"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { ShieldCheck, Trash2 } from "lucide-react";
import { Modal } from "./ui";
import { useApp } from "./app-context";
import { CONTENT as C } from "@/config/content.vi";

type Options = { title?: string; action?: string; destructive?: boolean };
type Request = { message: string; options: Options };
type Ask = (message: string, options?: Options) => Promise<boolean>;
const Context = createContext<Ask | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const { user, data } = useApp();
  const [request, setRequest] = useState<Request | null>(null);
  const pending = useRef<{
    resolve: (answer: boolean) => void;
    origin: HTMLElement | null;
  } | null>(null);
  useEffect(
    () => () => {
      // A decision must never authorize a mutation in a different session.
      pending.current?.resolve(false);
      pending.current = null;
      setRequest(null);
    },
    [user?.id, data.couple?.id],
  );
  const ask: Ask = (message, options = {}) => {
    if (pending.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      pending.current = {
        resolve,
        origin: document.activeElement as HTMLElement | null,
      };
      setRequest({ message, options });
    });
  };
  const settle = (answer: boolean) => {
    const current = pending.current;
    if (!current) return;
    pending.current = null;
    // Restore the trigger before run() reads its action scope.
    flushSync(() => setRequest(null));
    if (current.origin?.isConnected)
      current.origin.focus({ preventScroll: true });
    current.resolve(answer);
  };
  return (
    <Context.Provider value={ask}>
      {children}
      {request && (
        <Modal
          title={request.options.title ?? C.common.confirmation}
          role="alertdialog"
          onClose={() => settle(false)}
        >
          <div
            className={`confirmation-body ${request.options.destructive ? "destructive" : ""}`}
          >
            {request.options.destructive ? (
              <Trash2 size={28} aria-hidden="true" />
            ) : (
              <ShieldCheck size={28} aria-hidden="true" />
            )}
            <p>{request.message}</p>
          </div>
          <div className="confirmation-actions">
            <button
              type="button"
              className="button secondary"
              autoFocus
              onClick={() => settle(false)}
            >
              {C.common.cancel}
            </button>
            <button
              type="button"
              className={`button ${request.options.destructive ? "danger-button" : ""}`}
              onClick={() => settle(true)}
            >
              {request.options.action ?? C.common.yes}
            </button>
          </div>
        </Modal>
      )}
    </Context.Provider>
  );
}

export function useConfirmation() {
  const ask = useContext(Context);
  if (!ask) throw new Error("ConfirmationProvider is required");
  return ask;
}
