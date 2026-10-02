/**
 * VAPID Keys and Utilities for Web Push API
 */

export const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BBln8bWJGBqeIIldpfYmMB5MeFuwjHCf-gOLCbQx_MJnIrL6pzjbcMVNXmCRaxhd5CTA05kMTQP-rPz8IIdh6XI";

export const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "1dMmvtr3Wo0qNXByM5YJMmeW_0wm1XvQfyjZl_uHXsE";

export const DEFAULT_VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  "mailto:admin@a1score.app";

/**
 * Converts a base64 string to a Uint8Array backed by ArrayBuffer for PushManager.subscribe applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
