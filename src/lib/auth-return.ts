export function publicReturnPath(value: string | null | undefined) {
  return value && /^\/p\/[0-9]{9}$/.test(value) ? value : null;
}
