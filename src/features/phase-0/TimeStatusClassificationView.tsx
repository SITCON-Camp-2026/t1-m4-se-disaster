import type { Phase0MessyRecord } from "./phase0-types";
import {
  groupRecordsByTimeStatus,
  type Phase0TimeClassifiedRecord,
} from "./time-status";

type TimeStatusColumnProps = {
  title: string;
  description: string;
  records: Phase0TimeClassifiedRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
  tone: "expired" | "unknown" | "known";
};

function getCompactTimeLabel(item: Phase0TimeClassifiedRecord) {
  if (item.status === "known") {
    return item.timeLabel;
  }

  if (item.status === "expired") {
    return item.timeLabel === "原文有過期線索" ? "過期線索" : item.timeLabel;
  }

  return "未標時間";
}

function getCompactReason(item: Phase0TimeClassifiedRecord) {
  if (item.status === "known") {
    return "照時間排序";
  }

  if (item.status === "expired") {
    return "先停用";
  }

  return "需補時間";
}

function TimeStatusColumn({
  title,
  description,
  records,
  selectedRecordId,
  onSelect,
  tone,
}: TimeStatusColumnProps) {
  return (
    <section className={`time-status__column time-status__column--${tone}`}>
      <div className="time-status__column-header">
        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <span>{records.length} 筆</span>
      </div>

      <div className="time-status__list">
        {records.length ? (
          records.map((item) => (
            <article
              className={`time-card ${item.record.id === selectedRecordId ? "time-card--selected" : ""}`}
              key={item.record.id}
            >
              <div className="time-card__header">
                <h5>{item.record.id}</h5>
                <span>{getCompactTimeLabel(item)}</span>
              </div>
              <p className="time-card__reason">{getCompactReason(item)}</p>
              <button type="button" onClick={() => onSelect(item.record.id)}>
                查看
              </button>
            </article>
          ))
        ) : (
          <p className="empty-state empty-state--compact">目前沒有資料。</p>
        )}
      </div>
    </section>
  );
}

export function TimeStatusClassificationView({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const groups = groupRecordsByTimeStatus(records);

  return (
    <section className="time-status" aria-label="時間狀態分類">
      <div className="panel__header">
        <div>
          <p className="eyebrow">時間狀態分類</p>
          <h3>按時間先分區。</h3>
        </div>
        <span className="draft-count">{records.length} 筆</span>
      </div>
      <p className="time-status__note">只供整理，不是查核結果。</p>

      <div className="time-status__columns">
        <TimeStatusColumn
          title="已過期區"
          description="有失效線索。"
          records={groups.expired}
          selectedRecordId={selectedRecordId}
          onSelect={onSelect}
          tone="expired"
        />
        <TimeStatusColumn
          title="時間未知"
          description="缺明確時間。"
          records={groups.unknown}
          selectedRecordId={selectedRecordId}
          onSelect={onSelect}
          tone="unknown"
        />
        <TimeStatusColumn
          title="依時間排序"
          description="有明確時間。"
          records={groups.known}
          selectedRecordId={selectedRecordId}
          onSelect={onSelect}
          tone="known"
        />
      </div>
    </section>
  );
}
