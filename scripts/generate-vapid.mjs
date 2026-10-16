#!/usr/bin/env node
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log(`
Pegá esto en .env.local y en Vercel (Environment Variables):

NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}
VAPID_PRIVATE_KEY=${keys.privateKey}
VAPID_SUBJECT=mailto:avisos@juntada.app
`);
