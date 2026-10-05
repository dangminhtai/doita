"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-context";
import { Button } from "@/components/ui";
import { Bell } from "@/components/icons";
import { enabled } from "@/config/app.config";
import { CONTENT as C } from "@/config/content.vi";
import { db, authenticatedFetch } from "@/lib/supabase/browser";
import { serviceWorkerReady } from "@/lib/push-device";
export function ProfileNotifications() {
  const { user, run, notify } = useApp();
  const [pushState, setPushState] = useState("checking");
  const checkPush = async () => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) {
        setPushState("off");
        return;
      }
      const { data, error } = await db()
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("endpoint", subscription.endpoint)
        .maybeSingle();
      setPushState(error ? "error" : data ? "on" : "off");
    } catch {
      setPushState("error");
    }
  };
  useEffect(() => {
    void checkPush();
    window.addEventListener("focus", checkPush);
    return () => window.removeEventListener("focus", checkPush);
  }, [user?.id]);
  async function togglePush(enable: boolean) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      notify(C.settings.pushUnsupported, true);
      return;
    }
    await run(async () => {
      const registration = await serviceWorkerReady();
      let subscription = await registration.pushManager.getSubscription();
      if (!enable) {
        if (subscription) {
          await authenticatedFetch("/api/push", {
            method: "DELETE",
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
        setPushState("off");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "denied" : "off");
        notify(C.settings.pushDenied, true);
        return false;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Missing VAPID");
      const padding = "=".repeat((4 - (key.length % 4)) % 4);
      const raw = atob((key + padding).replace(/-/g, "+").replace(/_/g, "/"));
      const applicationServerKey = new Uint8Array(
        [...raw].map((c) => c.charCodeAt(0)),
      );
      subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      await authenticatedFetch("/api/push", {
        method: "POST",
        body: JSON.stringify(subscription.toJSON()),
      });
      setPushState("on");
    });
  }
  return (
    <>
      {" "}
      {enabled("notifications") && (
        <section className="settings-card">
          <Bell />
          <h2>{C.settings.notifications}</h2>
          <p role="status">
            {
              C.settings.pushStates[
                pushState as keyof typeof C.settings.pushStates
              ]
            }
          </p>
          <div className="row">
            <Button
              disabled={
                pushState === "unsupported" ||
                pushState === "denied" ||
                pushState === "checking"
              }
              onClick={() => void togglePush(pushState !== "on")}
            >
              {pushState === "on"
                ? C.settings.disablePush
                : C.settings.enablePush}
            </Button>
          </div>
          {pushState === "error" && (
            <Button secondary onClick={() => void checkPush()}>
              {C.common.retry}
            </Button>
          )}
        </section>
      )}
    </>
  );
}
