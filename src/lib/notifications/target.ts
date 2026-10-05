// Older notification records still point to the former couple route.
export function notificationTarget(url: string) {
  return url.replace(/^\/settings(?=[?#]|$)/, "/couple");
}
