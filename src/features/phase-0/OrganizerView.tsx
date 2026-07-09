import { StatusBadge } from "../../components/StatusBadge";
import { SourceLabel } from "../../components/SourceLabel";
import { formatDateTime } from "../../lib/date";
import type { Phase0MessyRecord } from "./phase0-types";

export function OrganizerView({ record }: { record: Phase0MessyRecord }) {
  const source = record.sourceType;
  const verification = record.verificationStatus;
  const needsHumanReview =
    verification === "needs_review" || verification === "unverified";
  const canActDirectly = !needsHumanReview && source !== "social_media";

  return (
    <section className="workbench__checklist" aria-label="資訊整理者視圖">
      <div className="panel__header">
        <div>
          <p className="eyebrow">資訊整理者視角</p>
          <h3>這筆資訊現在該怎麼理解？</h3>
        </div>
        <StatusBadge status={verification} />
      </div>

      <div className="judgement-summary">
        <div>
          <dt>資訊來源</dt>
          <dd>
            <SourceLabel sourceType={source} />
          </dd>
        </div>
        <div>
          <dt>查核狀態</dt>
          <dd>{verification}</dd>
        </div>
        <div>
          <dt>行動可行性</dt>
          <dd>{canActDirectly ? "可先觀察" : "暫時不可直接採取行動"}</dd>
        </div>
      </div>

      <div className="reason-card">
        <h4>不能直接成為任務的理由</h4>
        <ul>
          <li>來源未足夠確認，不能直接視為已查核。</li>
          <li>缺少確認者、時間戳或現場可執行資訊。</li>
          <li>若內容來自社群轉述，應先保留為候選而非正式任務。</li>
        </ul>
      </div>

      <div className="review-box">
        <h4>整理提醒</h4>
        <p>
          這筆資訊應先被標示為「候選」或「需要人工確認」，而不是直接被視為可執行任務。
        </p>
        <p>原始內容：{record.rawText}</p>
        <p>更新時間：{formatDateTime(record.updatedAt)}</p>
      </div>
    </section>
  );
}
