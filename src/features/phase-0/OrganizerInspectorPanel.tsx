import type { Phase0Draft, Phase0MessyRecord } from "./phase0-types";
import { createOrganizerInsight } from "./organizer-insights";

const qualityStatusLabels = {
  present: "有原文線索",
  needs_review: "需要人工確認",
  missing: "缺少",
};

export function OrganizerInspectorPanel({
  records,
  selectedRecord,
  selectedDraft,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecord: Phase0MessyRecord;
  selectedDraft?: Phase0Draft;
  onSelect: (recordId: string) => void;
}) {
  const insight = createOrganizerInsight({
    records,
    selectedRecord,
    selectedDraft,
  });

  return (
    <section className="organizer-panel" aria-label="整理者檢查面板">
      <div className="panel__header">
        <div>
          <p className="eyebrow">整理者檢查面板</p>
          <h3>先把缺口與推測攤開，再決定下一步要問誰。</h3>
        </div>
        <span className="draft-count">{selectedRecord.id}</span>
      </div>

      <div className="organizer-panel__grid">
        <section className="organizer-tool organizer-tool--wide">
          <h4>資料品質缺口表</h4>
          <div className="quality-table">
            {insight.qualityGaps.map((gap) => (
              <div className="quality-row" key={gap.label}>
                <span>{gap.label}</span>
                <strong className={`quality-pill quality-pill--${gap.status}`}>
                  {qualityStatusLabels[gap.status]}
                </strong>
                <p>{gap.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="organizer-tool">
          <h4>可能衝突提醒</h4>
          {insight.conflictGroups.length ? (
            <div className="conflict-list">
              {insight.conflictGroups.map((group) => (
                <article className="conflict-card" key={group.topic}>
                  <h5>{group.topic}</h5>
                  <p>{group.reason}</p>
                  <div className="conflict-card__records">
                    {group.records.map((record) => (
                      <button
                        className={
                          record.id === selectedRecord.id ? "active" : ""
                        }
                        key={record.id}
                        type="button"
                        onClick={() => onSelect(record.id)}
                      >
                        {record.id}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state empty-state--compact">
              目前沒有找到同主題的其他原始資訊，但仍需人工確認。
            </p>
          )}
        </section>

        <section className="organizer-tool">
          <h4>不能直接變成任務的原因</h4>
          <ul>
            {insight.actionBlockers.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        <section className="organizer-tool">
          <h4>人工確認清單</h4>
          <ol>
            {insight.confirmationQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </section>

        <section className="organizer-tool organizer-tool--wide">
          <h4>原文 vs 整理草稿對照</h4>
          <div className="comparison-grid">
            <div>
              <h5>原文可直接看出的線索</h5>
              <ul>
                {insight.comparison.rawSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5>整理草稿或推測</h5>
              <ul>
                {insight.comparison.draftClaims.map((claim) => (
                  <li key={claim}>{claim}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5>需要人工檢查</h5>
              <ul>
                {insight.comparison.reviewWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
