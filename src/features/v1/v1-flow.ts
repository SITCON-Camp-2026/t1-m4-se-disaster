import type { Phase0MessyRecord } from "../phase-0/phase0-types";
import { classifyRecordByTimeStatus } from "../phase-0/time-status";

export type V1FlowOutcome = "human_review" | "hold" | "candidate_draft";

export type V1CheckItem = {
  label: string;
  status: "ok" | "needs_review" | "missing";
  note: string;
};

export type V1TrustNote = {
  label: string;
  detail: string;
  level: "warning" | "danger" | "info";
};

export type V1FlowDecision = {
  outcome: V1FlowOutcome;
  outcomeLabel: string;
  outcomeNote: string;
  checks: V1CheckItem[];
  trustNotes: V1TrustNote[];
  risks: string[];
  logItems: string[];
};

const locationPattern =
  /光復|溪畔|老街|學校|A 區|大進|車站|活動中心|側門|住家|路口|出口|老雜貨店/;
const reporterPattern = /現場志工|值守志工|志工|家屬|來電者|回報者|有人|群組/;
const privacyPattern = /長者|親友|住家|完整地址|同意公開|不方便使用手機|電話/;
const thirdPartyPattern = /家屬|代一位|轉述|有人在群組|社群貼文|留言有人/;
const conflictPattern = /另一位|但不知道|不確定|可能沒更新|尚未看到|疑似/;

function toSourceLabel(sourceType: string) {
  const labels: Record<string, string> = {
    field_report: "現場回報",
    phone_call: "電話",
    social_post: "社群轉錄",
    official_notice: "官方公告",
    volunteer_update: "志工更新",
  };

  return labels[sourceType] ?? sourceType;
}

function createTrustNotes({
  record,
  hasLocation,
  hasReporter,
  hasPrivacyRisk,
  hasThirdPartyRisk,
  hasConflictRisk,
  isExpired,
  isTimeUnknown,
}: {
  record: Phase0MessyRecord;
  hasLocation: boolean;
  hasReporter: boolean;
  hasPrivacyRisk: boolean;
  hasThirdPartyRisk: boolean;
  hasConflictRisk: boolean;
  isExpired: boolean;
  isTimeUnknown: boolean;
}): V1TrustNote[] {
  const notes: Array<V1TrustNote | false> = [
    record.verificationStatus === "unverified" && {
      label: "未查核",
      detail: "查核狀態是 unverified，不能當成已確認。",
      level: "danger",
    },
    record.verificationStatus === "needs_review" && {
      label: "待確認",
      detail: "查核狀態是 needs_review，仍需人工確認。",
      level: "warning",
    },
    !record.verificationStatus && {
      label: "查核缺口",
      detail: "原始資訊沒有標示查核狀態。",
      level: "danger",
    },
    isExpired && {
      label: "可能過期",
      detail: "原文有過期或失效線索，不能當成現在狀態。",
      level: "danger",
    },
    isTimeUnknown && {
      label: "時間未知",
      detail: "原文缺少可排序的資訊時間。",
      level: "warning",
    },
    !hasLocation && {
      label: "地點缺口",
      detail: "缺少足夠地點線索，不能直接派人或轉任務。",
      level: "danger",
    },
    !hasReporter && {
      label: "確認者不明",
      detail: "缺少明確回報者、當事人或確認者。",
      level: "warning",
    },
    hasConflictRisk && {
      label: "內容衝突",
      detail: "原文出現不確定或互相衝突的線索。",
      level: "danger",
    },
    hasPrivacyRisk && {
      label: "隱私",
      detail: "原文含住家、親友、地址或公開同意風險。",
      level: "danger",
    },
    hasThirdPartyRisk && {
      label: "轉述",
      detail: "資訊可能來自第三方或非當事人轉述。",
      level: "warning",
    },
  ];

  return notes.filter((note): note is V1TrustNote => Boolean(note));
}

export function createV1FlowDecision(
  record: Phase0MessyRecord,
): V1FlowDecision {
  const timeStatus = classifyRecordByTimeStatus(record);
  const hasLocation = locationPattern.test(record.rawText);
  const hasReporter = reporterPattern.test(record.rawText);
  const hasVerificationStatus = Boolean(record.verificationStatus);
  const hasPrivacyRisk = privacyPattern.test(record.rawText);
  const hasThirdPartyRisk = thirdPartyPattern.test(record.rawText);
  const hasConflictRisk = conflictPattern.test(record.rawText);
  const isExpired = timeStatus.status === "expired";
  const isTimeUnknown = timeStatus.status === "unknown";
  const trustNotes = createTrustNotes({
    record,
    hasLocation,
    hasReporter,
    hasPrivacyRisk,
    hasThirdPartyRisk,
    hasConflictRisk,
    isExpired,
    isTimeUnknown,
  });

  const checks: V1CheckItem[] = [
    {
      label: "保留原文",
      status: "ok",
      note: "原始文字保留，整理者可追溯。",
    },
    {
      label: "來源 / 查核分開",
      status: hasVerificationStatus ? "needs_review" : "missing",
      note: `來源是${toSourceLabel(record.sourceType)}，查核狀態是 ${record.verificationStatus || "未標示"}。`,
    },
    {
      label: "時間",
      status:
        timeStatus.status === "known"
          ? "ok"
          : isExpired
            ? "needs_review"
            : "missing",
      note:
        timeStatus.status === "known"
          ? `原文時間：${timeStatus.timeLabel}`
          : timeStatus.reason,
    },
    {
      label: "地點",
      status: hasLocation ? "needs_review" : "missing",
      note: hasLocation
        ? "有地點線索，仍需確認可執行性。"
        : "缺少足夠地點線索。",
    },
    {
      label: "當事人 / 確認者",
      status: hasReporter ? "needs_review" : "missing",
      note: hasReporter
        ? "有回報者線索，需確認是否能代表當事人。"
        : "缺少明確回報者或確認者。",
    },
  ];

  const risks = trustNotes.map((note) => `${note.label}：${note.detail}`);

  const missingCritical = checks.some((check) => check.status === "missing");
  const shouldHold = isExpired || hasPrivacyRisk || hasThirdPartyRisk;
  const outcome: V1FlowOutcome = missingCritical
    ? "human_review"
    : shouldHold
      ? "hold"
      : "candidate_draft";

  const outcomeLabels: Record<V1FlowOutcome, string> = {
    human_review: "需要人工確認",
    hold: "暫時不採用",
    candidate_draft: "候選草稿",
  };
  const outcomeNotes: Record<V1FlowOutcome, string> = {
    human_review: "資訊還不夠完整，先補缺口，不轉成任務。",
    hold: "有風險線索，先保留理由，不能直接形成候選結果。",
    candidate_draft: "可形成候選草稿，但仍不能顯示成已確認。",
  };

  return {
    outcome,
    outcomeLabel: outcomeLabels[outcome],
    outcomeNote: outcomeNotes[outcome],
    checks,
    trustNotes,
    risks,
    logItems: [
      `保留 ${record.id} 原文。`,
      `分開顯示來源：${toSourceLabel(record.sourceType)}；查核狀態：${record.verificationStatus || "未標示"}。`,
      `低信任注記：${trustNotes.map((note) => note.label).join("、")}。`,
      `${outcomeLabels[outcome]}：${outcomeNotes[outcome]}`,
    ],
  };
}

export function summarizeV1Decisions(records: Phase0MessyRecord[]) {
  return records.reduce(
    (summary, record) => {
      const decision = createV1FlowDecision(record);
      summary[decision.outcome] += 1;
      return summary;
    },
    {
      human_review: 0,
      hold: 0,
      candidate_draft: 0,
    },
  );
}
