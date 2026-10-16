/** VAPID config for Web Push (free). */

export function vapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
}

export function vapidPrivateKey(): string {
  return process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
}

export function vapidSubject(): string {
  return (
    process.env.VAPID_SUBJECT?.trim() ||
    "mailto:avisos@juntada.app"
  );
}

export function isPushConfigured(): boolean {
  return Boolean(vapidPublicKey() && vapidPrivateKey());
}
