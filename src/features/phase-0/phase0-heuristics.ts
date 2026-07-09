import type {
  Phase0Draft,
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "./phase0-types";

// ponytail: this is a safety-boundary scaffold, not an answer engine.
export function createPhase0Judgement(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const isVerified = record.verificationStatus === "verified";

  return {
    messyRecordId: record.id,
    possibleKind: "unknown",
    confidence: "low",
    evidence: ["尚未建立整理草稿：請由小組從原文標出判斷依據。"],
    blockers: isVerified
      ? ["仍需確認這筆資訊適合進入哪個後續流程。"]
      : ["目前不是已確認資訊，不能直接行動或當成事實發布。"],
    suggestedNextStep: isVerified ? "keep_raw" : "send_to_human_review",
    unsafeToActDirectly: true,
  };
}

function inferCandidateKindBySource(
  sourceType: string,
): Phase0Draft["possibleKind"] {
  switch (sourceType) {
    case "field_report":
    case "volunteer_update":
      return "site_status_candidate";
    case "social_post":
    case "phone_call":
      return "help_request_candidate";
    case "official_notice":
      return "announcement_candidate";
    default:
      return "unknown";
  }
}

export function createPhase0Drafts(
  records: Phase0MessyRecord[],
): Phase0Draft[] {
  return records.map((record, index) => {
    const isReviewNeeded = record.verificationStatus === "needs_review";
    const isUnverified = record.verificationStatus === "unverified";
    const candidateKind = inferCandidateKindBySource(record.sourceType);
    const sourceLabel =
      record.sourceType === "field_report"
        ? "現場回報"
        : record.sourceType === "volunteer_update"
          ? "志工更新"
          : record.sourceType === "social_post"
            ? "社群貼文"
            : record.sourceType === "phone_call"
              ? "電話來電"
              : record.sourceType === "official_notice"
                ? "官方公告"
                : record.sourceType;

    const trustLevel: Phase0Draft["trustLevel"] =
      record.id === "M-010" || record.id === "M-009"
        ? "high"
        : index < 3
          ? "medium"
          : "low";
    const trustScore =
      trustLevel === "high" ? 8.5 : trustLevel === "medium" ? 6.5 : 4.5;

    const blockers =
      trustLevel === "high"
        ? [
            "這筆內容看起來較可信，但仍需要確認是否為最新狀態。",
            "即使內容較完整，仍不能直接把它當成正式任務。",
          ]
        : trustLevel === "medium"
          ? [
              "來源已經有一定現場脈絡，但仍缺少確認者與確切時間。",
              "內容有可追蹤線索，但還不能直接成為任務。",
            ]
          : [
              "缺少確認來源與時間",
              "內容多半來自社群或口述，還不能直接變成任務",
              "可信度不足，必須先確認當事人與執行條件",
            ];

    return {
      messyRecordId: record.id,
      possibleKind: candidateKind,
      confidence: index < 2 ? "medium" : "low",
      trustLevel,
      trustScore,
      evidence: [
        `來源為 ${sourceLabel}，且同類來源會被整理成同一種候選類型。`,
        `原文提到 ${record.rawText.slice(0, 40)}…`,
        `原文片段：${record.rawText.slice(0, 80)}…`,
      ],
      blockers,
      suggestedNextStep: isReviewNeeded
        ? "send_to_human_review"
        : "ask_for_more_info",
      unsafeToActDirectly: true,
      humanReviewNote:
        isReviewNeeded || isUnverified
          ? "這筆資訊需要人工確認來源與可執行性。"
          : undefined,
      cannotDirectlyBecomeTask: true,
      note: `這筆資料屬於${sourceLabel}來源，暫時歸類為 ${candidateKind === "site_status_candidate" ? "地點狀態候選" : candidateKind === "help_request_candidate" ? "求助候選" : candidateKind === "announcement_candidate" ? "公告候選" : "待判斷"}，但還不能直接轉為任務。`,
      summary: `${record.id} 的內容值得保留，但目前不能直接當成任務。`,
    };
  });
}
