import { useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { filterDraftsByQuery } from "./phase0-draft-search";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { OrganizerView } from "./OrganizerView";
import { OrganizerInspectorPanel } from "./OrganizerInspectorPanel";
import { createPhase0Drafts, createPhase0Judgement } from "./phase0-heuristics";
import type { Phase0Draft, Phase0MessyRecord } from "./phase0-types";
import { TimeStatusClassificationView } from "./TimeStatusClassificationView";
import { TrustClassificationView } from "./TrustClassificationView";

export function Phase0Workbench({
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
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const initialDrafts = useMemo(() => createPhase0Drafts(records), [records]);
  const [drafts, setDrafts] = useState<Phase0Draft[]>(initialDrafts);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const reviewDraftCount = drafts.filter(
    (draft) => draft.humanReviewNote,
  ).length;
  const blockedTaskCount = drafts.filter(
    (draft) => draft.cannotDirectlyBecomeTask,
  ).length;
  const visibleDrafts = useMemo(
    () => filterDraftsByQuery(drafts, searchQuery),
    [drafts, searchQuery],
  );

  const selectedDraft =
    visibleDrafts.find((draft) => draft.messyRecordId === selectedDraftId) ??
    visibleDrafts.find((draft) => draft.messyRecordId === selectedRecord.id) ??
    visibleDrafts[0] ??
    drafts.find((draft) => draft.messyRecordId === selectedDraftId) ??
    drafts.find((draft) => draft.messyRecordId === selectedRecord.id) ??
    drafts[0];

  function updateDraft<K extends keyof Phase0Draft>(
    field: K,
    value: Phase0Draft[K],
  ) {
    if (!selectedDraft) {
      return;
    }

    setDrafts((current) =>
      current.map((draft) =>
        draft.messyRecordId === selectedDraft.messyRecordId
          ? { ...draft, [field]: value }
          : draft,
      ),
    );
  }

  function addDraft() {
    const baseDraft = createPhase0Drafts([selectedRecord])[0];
    const newDraft: Phase0Draft = {
      ...baseDraft,
      messyRecordId: `${selectedRecord.id}-draft-${drafts.length + 1}`,
      summary: `新增草稿：${selectedRecord.id}`,
      note: "請補充判斷依據、確認者與下一步。",
      humanReviewNote: "請確認這筆資訊是否足夠支撐任務建立。",
      blockers: [...baseDraft.blockers, "需要補充現場確認者與確認時間"],
    };

    setDrafts((current) => [...current, newDraft]);
    setSelectedDraftId(newDraft.messyRecordId);
  }

  function deleteCurrentDraft() {
    if (!selectedDraft) {
      return;
    }

    setDrafts((current) =>
      current.filter(
        (draft) => draft.messyRecordId !== selectedDraft.messyRecordId,
      ),
    );
    setSelectedDraftId(null);
  }

  function resetDrafts() {
    setDrafts(createPhase0Drafts(records));
    setSelectedDraftId(null);
    setSearchQuery("");
  }

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。</h2>
        <p>
          這裡先只標示安全邊界，真正的候選判斷要由小組和 coding agent
          補上；這不是 runtime LLM 分析，也不是正式資料模型。
          目前已加入新增、刪除、重設草稿，並把「不能成為任務」的理由清楚列出。
        </p>
      </div>

      <section className="phase-check" aria-label="第一階段完成檢查">
        <div className="phase-check__header">
          <h3>第一階段完成檢查</h3>
          <span>請補 observations / ai-log</span>
        </div>
        <ul>
          <li>
            <strong>{records.length}</strong>
            <span>原始資訊</span>
          </li>
          <li>
            <strong>{drafts.length}</strong>
            <span>整理草稿</span>
          </li>
          <li>
            <strong>{reviewDraftCount}</strong>
            <span>人工確認</span>
          </li>
          <li>
            <strong>{blockedTaskCount}</strong>
            <span>不能成任務</span>
          </li>
        </ul>
      </section>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          {records.map((record) => (
            <button
              className={record.id === selectedRecord.id ? "active" : ""}
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
            >
              <span>{record.id}</span>
              <StatusBadge status={record.verificationStatus} />
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          <Phase0JudgementCard
            judgement={safetyBoundary}
            record={selectedRecord}
          />

          <OrganizerView record={selectedRecord} />

          <TimeStatusClassificationView
            records={records}
            selectedRecordId={selectedRecord.id}
            onSelect={onSelect}
          />

          <OrganizerInspectorPanel
            records={records}
            selectedRecord={selectedRecord}
            selectedDraft={selectedDraft}
            onSelect={onSelect}
          />

          <TrustClassificationView drafts={drafts} />

          <section className="draft-editor" aria-label="整理草稿">
            <div className="panel__header">
              <div>
                <h3>可編輯整理草稿</h3>
                <p>
                  現在可直接新增、刪除草稿，並查看為什麼這筆資訊不能直接成為任務。
                </p>
              </div>
              <div className="draft-editor__actions">
                <span className="draft-count">{drafts.length} 筆</span>
                <button type="button" onClick={addDraft}>
                  新增
                </button>
                <button type="button" onClick={resetDrafts}>
                  重設草稿
                </button>
              </div>
            </div>

            <label className="draft-search">
              <span>搜尋草稿</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="輸入關鍵字，如：電力、志工、確認"
              />
            </label>

            <div className="draft-editor__layout">
              <aside className="draft-editor__list" aria-label="草稿清單">
                <div className="draft-editor__list-header">
                  <h4>草稿清單</h4>
                  <span>
                    {visibleDrafts.length}/{drafts.length} 項
                  </span>
                </div>
                {visibleDrafts.length ? (
                  visibleDrafts.map((draft) => (
                    <button
                      key={draft.messyRecordId}
                      type="button"
                      className={
                        draft.messyRecordId === selectedDraft?.messyRecordId
                          ? "active"
                          : ""
                      }
                      onClick={() => setSelectedDraftId(draft.messyRecordId)}
                    >
                      <span>{draft.messyRecordId}</span>
                      <small>
                        {draft.trustLevel === "high"
                          ? `較可信 • ${draft.trustScore.toFixed(1)} / 10`
                          : draft.trustLevel === "medium"
                            ? `中等 • ${draft.trustScore.toFixed(1)} / 10`
                            : `較弱 • ${draft.trustScore.toFixed(1)} / 10`}
                      </small>
                    </button>
                  ))
                ) : (
                  <p className="empty-state empty-state--compact">
                    沒有符合「{searchQuery}」的草稿。
                  </p>
                )}
              </aside>

              {selectedDraft ? (
                <div className="draft-editor__body">
                  <div className="draft-editor__body-header">
                    <h4>{selectedDraft.messyRecordId}</h4>
                    <button type="button" onClick={deleteCurrentDraft}>
                      刪除
                    </button>
                  </div>

                  <label className="draft-editor__field--candidate">
                    <span>候選類型</span>
                    <select
                      value={selectedDraft.possibleKind}
                      onChange={(event) =>
                        updateDraft(
                          "possibleKind",
                          event.target.value as Phase0Draft["possibleKind"],
                        )
                      }
                    >
                      <option value="help_request_candidate">求助候選</option>
                      <option value="site_status_candidate">
                        地點狀態候選
                      </option>
                      <option value="task_candidate">任務候選</option>
                      <option value="assignment_candidate">人員指派候選</option>
                      <option value="announcement_candidate">公告候選</option>
                      <option value="unknown">待判斷</option>
                    </select>
                  </label>

                  <label>
                    <span>摘要</span>
                    <textarea
                      value={selectedDraft.summary}
                      onChange={(event) =>
                        updateDraft("summary", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>筆記</span>
                    <textarea
                      value={selectedDraft.note}
                      onChange={(event) =>
                        updateDraft("note", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>人工確認備註</span>
                    <textarea
                      value={selectedDraft.humanReviewNote ?? ""}
                      onChange={(event) =>
                        updateDraft("humanReviewNote", event.target.value)
                      }
                    />
                  </label>

                  <section className="reason-card">
                    <h4>不能直接成為任務的理由</h4>
                    <ul>
                      {selectedDraft.blockers.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                    <p>
                      這些理由會讓後續協作者知道還缺少哪些確認，避免把未驗證資訊誤當成正式任務。
                    </p>
                  </section>

                  <section className="reason-card reason-card--trust">
                    <h4>可信度標記</h4>
                    <p>
                      {selectedDraft.trustLevel === "high"
                        ? `這筆內容的來源與描述較完整，因此被標為較可信，信任分數為 ${selectedDraft.trustScore.toFixed(1)} / 10，但仍需確認最新狀態。`
                        : selectedDraft.trustLevel === "medium"
                          ? `這筆內容有一定脈絡，適合先保留並追蹤，信任分數為 ${selectedDraft.trustScore.toFixed(1)} / 10，但還不能直接當作任務。`
                          : `這筆內容主要來自社群或口述，可信度較弱，信任分數為 ${selectedDraft.trustScore.toFixed(1)} / 10，必須先補足確認資訊。`}
                    </p>
                  </section>

                  <section className="reason-card">
                    <h4>來源歸類</h4>
                    <p>
                      這筆草稿會依照來源類型歸類；同一類來源的資訊會被整理成相同候選類型，方便後續比較與追蹤。
                    </p>
                  </section>

                  <section className="review-box">
                    <h4>自我評分與評語</h4>
                    <label>
                      <span>評分（0-10）</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={selectedDraft.trustScore}
                        onChange={(event) =>
                          updateDraft("trustScore", Number(event.target.value))
                        }
                      />
                    </label>
                    <label>
                      <span>評語</span>
                      <textarea
                        className="review-box__textarea"
                        value={selectedDraft.note}
                        onChange={(event) =>
                          updateDraft("note", event.target.value)
                        }
                        placeholder="請輸入你對這筆草稿的判斷、風險與下一步建議。"
                      />
                    </label>
                  </section>

                  <div className="draft-editor__chips">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedDraft.cannotDirectlyBecomeTask}
                        onChange={(event) =>
                          updateDraft(
                            "cannotDirectlyBecomeTask",
                            event.target.checked,
                          )
                        }
                      />
                      <span>不能直接變成任務</span>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
