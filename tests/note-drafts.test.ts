import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyNoteDraft,
  parseNoteDraft,
  noteDraftKey,
} from "../src/features/notes/draft";
test("draft round trip retains privacy, title, checklist type and edit identity", () => {
  for (const visibility of ["private", "couple", "partner"]) {
    for (const editing of [null, "note-id"]) {
      const draft = {
        editing,
        title: "Tiêu đề",
        body: "một\nhai",
        type: "checklist",
        visibility,
      };
      assert.deepEqual(parseNoteDraft(JSON.stringify(draft)), draft);
    }
  }
});
test("new and edited drafts are isolated by account and note", () => {
  assert.notEqual(noteDraftKey("a", null), noteDraftKey("a", "note-id"));
  assert.notEqual(noteDraftKey("a", null), noteDraftKey("b", null));
  assert.equal(emptyNoteDraft().visibility, "private");
  assert.equal(parseNoteDraft("legacy body"), null);
  assert.equal(parseNoteDraft(JSON.stringify({ body: "secret" })), null);
});
