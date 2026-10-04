export type PrayerDraft = {
  body: string;
  visibility: "private" | "partner";
  resurface: boolean;
  draftId: string | null;
};
export const emptyPrayerDraft = (): PrayerDraft => ({
  body: "",
  visibility: "private",
  resurface: true,
  draftId: null,
});
export function parsePrayerDraft(value: string | null): PrayerDraft | null {
  if (!value) return null;
  try {
    const d = JSON.parse(value);
    if (
      typeof d.body !== "string" ||
      !["private", "partner"].includes(d.visibility) ||
      typeof d.resurface !== "boolean" ||
      !(d.draftId === null || typeof d.draftId === "string")
    )
      return null;
    return {
      body: d.body,
      visibility: d.visibility,
      resurface: d.resurface,
      draftId: d.draftId,
    };
  } catch {
    return null;
  }
}
export function prayerDraftKey(
  userId: string,
  coupleId: string,
  id: string | null,
) {
  return `couple-draft:${userId}:prayer:${coupleId}:${id ?? "new"}`;
}
