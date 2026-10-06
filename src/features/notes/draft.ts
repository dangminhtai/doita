export type NoteDraft = {
  editing: string | null;
  title: string;
  body: string;
  type: string;
  visibility: string;
  lifetime: string;
};
export const emptyNoteDraft = (): NoteDraft => ({
  editing: null,
  title: "",
  body: "",
  type: "text",
  visibility: "private",
  lifetime: "forever",
});
export function parseNoteDraft(value: string | null): NoteDraft | null {
  if (!value) return null;
  try {
    const d = JSON.parse(value);
    if (
      typeof d.title !== "string" ||
      typeof d.body !== "string" ||
      !["text", "checklist"].includes(d.type) ||
      !["private", "couple", "partner"].includes(d.visibility) ||
      !(d.editing === null || typeof d.editing === "string") ||
      (d.lifetime !== undefined &&
        !["15m", "1h", "1d", "1w", "forever"].includes(d.lifetime))
    )
      return null;
    return {
      editing: d.editing,
      title: d.title,
      body: d.body,
      type: d.type,
      visibility: d.visibility,
      lifetime: d.lifetime ?? "forever",
    };
  } catch {
    return null;
  }
}
export function noteDraftKey(
  userId: string,
  editing: string | null,
  coupleId?: string,
) {
  return `couple-draft:${userId}:${coupleId ? coupleId + ":" : ""}note:${editing ?? "new"}`;
}
