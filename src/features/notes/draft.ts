export type NoteDraft = {
  editing: string | null;
  title: string;
  body: string;
  type: string;
  visibility: string;
};
export const emptyNoteDraft = (): NoteDraft => ({
  editing: null,
  title: "",
  body: "",
  type: "text",
  visibility: "private",
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
      !(d.editing === null || typeof d.editing === "string")
    )
      return null;
    return {
      editing: d.editing,
      title: d.title,
      body: d.body,
      type: d.type,
      visibility: d.visibility,
    };
  } catch {
    return null;
  }
}
export function noteDraftKey(userId: string, editing: string | null) {
  return `couple-draft:${userId}:note:${editing ?? "new"}`;
}
