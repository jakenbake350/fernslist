import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  await navigator.serviceWorker.register("/sw.js");
  return true;
}

export async function getNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export async function subscribeToPush(boardId) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await saveSubscription(existing, boardId);
      return true;
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await saveSubscription(sub, boardId);
    return true;
  } catch {
    return false;
  }
}

async function saveSubscription(subscription, boardId) {
  const sub = subscription.toJSON();
  await supabase.from("push_subscriptions").upsert({
    board_id: boardId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  }, { onConflict: "endpoint" });
}

export async function unsubscribeFromPush(boardId) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    return true;
  } catch {
    return false;
  }
}
