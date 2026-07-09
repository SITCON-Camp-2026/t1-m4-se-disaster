import type { Phase0Draft } from "./phase0-types";

function getTrustLabel(level: Phase0Draft["trustLevel"]) {
  switch (level) {
    case "high":
      return "高可信度";
    case "medium":
      return "中可信度";
    default:
      return "低可信度";
  }
}

function getTrustHint(level: Phase0Draft["trustLevel"]) {
  switch (level) {
    case "high":
      return "來源與內容較完整，但仍需確認最新狀態。";
    case "medium":
      return "有一定現場脈絡，但仍缺少確認者與確切時間。";
    default:
      return "內容多半來自社群或口述，應先保留為候選。";
  }
}

export function TrustClassificationView({ drafts }: { drafts: Phase0Draft[] }) {
  return (
    <section className="workbench__checklist" aria-label="可信度分類">
      <div className="panel__header">
        <div>
          <p className="eyebrow">可信度分類</p>
          <h3>這些資訊值得多大程度相信？</h3>
        </div>
      </div>

      <div className="grid">
        {drafts.map((draft) => {
          const trustClass =
            draft.trustLevel === "high"
              ? "trust-card trust-card--high"
              : draft.trustLevel === "medium"
                ? "trust-card trust-card--medium"
                : "trust-card trust-card--low";

          return (
            <article key={draft.messyRecordId} className={trustClass}>
              <div className="record-card__header">
                <h3>{draft.messyRecordId}</h3>
                <span
                  className={`status-badge ${draft.trustLevel === "high" ? "status-verified" : draft.trustLevel === "medium" ? "status-needs_review" : "status-unverified"}`}
                >
                  {getTrustLabel(draft.trustLevel)}
                </span>
              </div>
              <p>{getTrustHint(draft.trustLevel)}</p>
              <div className="record-card__meta">
                <span>信任分數：{draft.trustScore.toFixed(1)} / 10</span>
                <span>
                  建議下一步：
                  {draft.suggestedNextStep === "send_to_human_review"
                    ? "交給人工確認"
                    : draft.suggestedNextStep === "ask_for_more_info"
                      ? "補充資訊"
                      : "先保留原始內容"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
