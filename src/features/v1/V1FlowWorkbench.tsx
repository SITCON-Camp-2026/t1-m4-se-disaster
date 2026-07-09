import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0MessyRecord } from "../phase-0/phase0-types";
import { createV1FlowDecision, summarizeV1Decisions } from "./v1-flow";

export function V1FlowWorkbench({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const decision = createV1FlowDecision(selectedRecord);
  const summary = summarizeV1Decisions(records);

  return (
    <div className="v1-workbench">
      <section className="v1-notice" aria-label="v1 資料來源提醒">
        <div>
          <p className="eyebrow">v1 / 開始確認</p>
          <h2>從原始資訊開始，先確認能不能安全形成候選草稿。</h2>
        </div>
        <p>
          資料仍來自 Phase 0 原始資訊；這不是整理後資料，也沒有任何已確認任務。
        </p>
      </section>

      <section className="v1-summary" aria-label="v1 流程摘要">
        <div>
          <strong>{summary.human_review}</strong>
          <span>需要人工確認</span>
        </div>
        <div>
          <strong>{summary.hold}</strong>
          <span>暫時不採用</span>
        </div>
        <div>
          <strong>{summary.candidate_draft}</strong>
          <span>候選草稿</span>
        </div>
      </section>

      <div className="v1-layout">
        <aside className="v1-record-list" aria-label="選擇 v1 原始資訊">
          {records.map((record) => {
            const itemDecision = createV1FlowDecision(record);
            return (
              <button
                className={record.id === selectedRecord.id ? "active" : ""}
                key={record.id}
                type="button"
                onClick={() => onSelect(record.id)}
              >
                <span className="v1-record-list__top">
                  <strong>{record.id}</strong>
                  <small>{itemDecision.outcomeLabel}</small>
                </span>
                <span
                  className="v1-trust-chips"
                  aria-label={`${record.id} 低信任注記`}
                >
                  {itemDecision.trustNotes.map((note) => (
                    <span
                      className={`v1-trust-chip v1-trust-chip--${note.level}`}
                      key={note.label}
                    >
                      {note.label}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </aside>

        <section className="v1-main" aria-label="開始確認主流程">
          <article className="v1-raw">
            <div className="record-card__header">
              <h3>{selectedRecord.id}</h3>
              <StatusBadge status={selectedRecord.verificationStatus} />
            </div>
            <p>{selectedRecord.rawText}</p>
            <div className="record-card__meta">
              <SourceLabel sourceType={selectedRecord.sourceType} />
              <span>更新：{formatDateTime(selectedRecord.updatedAt)}</span>
            </div>
            <section
              className="v1-trust-panel"
              aria-label={`${selectedRecord.id} 低信任理由`}
            >
              <div className="v1-trust-panel__header">
                <h4>低信任注記</h4>
                <span>{decision.trustNotes.length}</span>
              </div>
              <p>這些注記只說明不能直接相信的原因，不是真偽判定。</p>
              <ul>
                {decision.trustNotes.map((note) => (
                  <li
                    className={`v1-trust-note v1-trust-note--${note.level}`}
                    key={note.label}
                  >
                    <strong>{note.label}</strong>
                    <span>{note.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          </article>

          <section className="v1-stepper" aria-label="開始確認步驟">
            {decision.checks.map((check, index) => (
              <article
                className={`v1-step v1-step--${check.status}`}
                key={check.label}
              >
                <span>{index + 1}</span>
                <div>
                  <h4>{check.label}</h4>
                  <p>{check.note}</p>
                </div>
              </article>
            ))}
          </section>
        </section>

        <aside className={`v1-decision v1-decision--${decision.outcome}`}>
          <p className="eyebrow">流程判斷</p>
          <h3>{decision.outcomeLabel}</h3>
          <p>{decision.outcomeNote}</p>

          <h4>不能自動處理的風險</h4>
          <ul>
            {decision.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>

          <h4>判斷紀錄草稿</h4>
          <ol>
            {decision.logItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
