import type { Phase0Draft } from "./phase0-types";

export function filterDraftsByQuery(drafts: Phase0Draft[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return drafts;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return drafts.filter((draft) => {
    const searchableText = [
      draft.messyRecordId,
      draft.summary,
      draft.note,
      draft.humanReviewNote ?? "",
      draft.possibleKind,
      draft.trustLevel,
      ...draft.blockers,
      ...draft.evidence,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return tokens.every((token) => {
      const chars = [...token.replace(/[^a-z0-9\u4e00-\u9fff]/g, "")];

      if (!chars.length) {
        return false;
      }

      return chars.some((char) => searchableText.includes(char));
    });
  });
}
