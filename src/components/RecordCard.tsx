import { SourceLabel } from "./SourceLabel";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "../lib/date";

type RecordLike = {
  id: string;
  title?: string;
  name?: string;
  rawText?: string;
  description?: string;
  sourceType: string;
  verificationStatus: string;
  updatedAt?: string;
};

export function RecordCard({ record }: { record: RecordLike }) {
  const title = record.title ?? record.name ?? record.id;
  const description = record.rawText ?? record.description;
  return (
    <article className="record-card">
      <div className="record-card__header">
        <h3>{title}</h3>
        <StatusBadge status={record.verificationStatus} />
      </div>
      {description ? <p>{description}</p> : null}
      <div className="record-card__meta">
        <SourceLabel sourceType={record.sourceType} />
        <span>更新：{formatDateTime(record.updatedAt)}</span>
      </div>
    </article>
  );
}
