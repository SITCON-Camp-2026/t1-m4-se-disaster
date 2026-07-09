import type { Phase0Draft, Phase0MessyRecord } from "./phase0-types";
import { classifyRecordByTimeStatus } from "./time-status";

export type Phase0QualityStatus = "present" | "needs_review" | "missing";

export type Phase0QualityGap = {
  label: string;
  status: Phase0QualityStatus;
  statusLabel: string;
  note: string;
};

export type Phase0ConflictGroup = {
  topic: string;
  reason: string;
  records: Phase0MessyRecord[];
};

export type Phase0RawDraftComparison = {
  rawSignals: string[];
  draftClaims: string[];
  reviewWarnings: string[];
};

export type Phase0OrganizerInsight = {
  qualityGaps: Phase0QualityGap[];
  conflictGroups: Phase0ConflictGroup[];
  actionBlockers: string[];
  confirmationQuestions: string[];
  comparison: Phase0RawDraftComparison;
};

type TopicRule = {
  topic: string;
  pattern: RegExp;
};

const locationPattern =
  /光復|溪畔|老街|學校|A 區|大進|車站|活動中心|側門|住家|路口|出口|老雜貨店/;
const reporterPattern = /現場志工|值守志工|志工|家屬|來電者|回報者|有人|群組/;
const privacyPattern = /長者|親友|住家|完整地址|同意公開|不方便使用手機|電話/;
const confirmationPattern = /確認|回報|公告|值守/;

const topicRules: TopicRule[] = [
  { topic: "雨鞋與物資狀態", pattern: /雨鞋|飲用水|二手衣物|物資/ },
  { topic: "水電支援", pattern: /水電|檢修/ },
  { topic: "集合點與派人限制", pattern: /集合點|派人|報到|開放|停留/ },
  { topic: "公告與道路狀態", pattern: /公告|道路|封閉|同步更新/ },
  { topic: "住家協助與隱私", pattern: /住家|長者|親友|地址|同意公開/ },
];

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function hasLocationSignal(rawText: string) {
  return locationPattern.test(rawText);
}

function hasReporterSignal(rawText: string) {
  return reporterPattern.test(rawText);
}

function hasPrivacySignal(rawText: string) {
  return privacyPattern.test(rawText);
}

function getTopics(record: Phase0MessyRecord) {
  return topicRules
    .filter((rule) => rule.pattern.test(record.rawText))
    .map((rule) => rule.topic);
}

function createQualityGaps(record: Phase0MessyRecord): Phase0QualityGap[] {
  const timeStatus = classifyRecordByTimeStatus(record);
  const hasLocation = hasLocationSignal(record.rawText);
  const hasReporter = hasReporterSignal(record.rawText);
  const hasPrivacyRisk = hasPrivacySignal(record.rawText);
  const hasConfirmation = confirmationPattern.test(record.rawText);
  const isVerified = record.verificationStatus === "verified";

  return [
    {
      label: "資訊取得方式",
      status: record.sourceType ? "present" : "missing",
      statusLabel: record.sourceType ? "有原文線索" : "缺少",
      note: record.sourceType
        ? `來源類型是 ${record.sourceType}，但 sourceType 不是查核結果。`
        : "原始資訊沒有標示來源類型。",
    },
    {
      label: "查核狀態",
      status: isVerified ? "present" : "needs_review",
      statusLabel: isVerified ? "有原文線索" : "需要人工確認",
      note: isVerified
        ? "即使標示已確認，仍要確認適合哪個後續流程。"
        : `目前是 ${record.verificationStatus}，不能顯示成已確認。`,
    },
    {
      label: "資訊時間",
      status:
        timeStatus.status === "known"
          ? "present"
          : timeStatus.status === "expired"
            ? "needs_review"
            : "missing",
      statusLabel:
        timeStatus.status === "known"
          ? "有原文線索"
          : timeStatus.status === "expired"
            ? "需要人工確認"
            : "缺少",
      note:
        timeStatus.status === "known"
          ? `原文時間是 ${timeStatus.timeLabel}，但仍不是查核結果。`
          : timeStatus.reason,
    },
    {
      label: "地點可執行性",
      status: hasLocation ? "needs_review" : "missing",
      statusLabel: hasLocation ? "需要人工確認" : "缺少",
      note: hasLocation
        ? "原文有地點線索，但仍要確認是否足夠讓人安全抵達。"
        : "原文沒有足夠地點線索。",
    },
    {
      label: "當事人或回報者",
      status: hasReporter ? "needs_review" : "missing",
      statusLabel: hasReporter ? "需要人工確認" : "缺少",
      note: hasReporter
        ? "原文有回報者或轉述者線索，需要確認是否為當事人。"
        : "原文沒有明確說明誰能代表這筆資訊。",
    },
    {
      label: "確認者與確認時間",
      status: hasConfirmation ? "needs_review" : "missing",
      statusLabel: hasConfirmation ? "需要人工確認" : "缺少",
      note: hasConfirmation
        ? "原文有確認或回報字樣，但仍需確認角色、時間與查核狀態。"
        : "原文沒有明確確認者與確認時間。",
    },
    {
      label: "是否可公開",
      status: hasPrivacyRisk ? "needs_review" : "missing",
      statusLabel: hasPrivacyRisk ? "需要人工確認" : "缺少",
      note: hasPrivacyRisk
        ? "原文含住家、長者、親友或公開同意線索，需先確認隱私邊界。"
        : "原文沒有說明資訊是否可以公開或轉派。",
    },
    {
      label: "是否仍有效",
      status: timeStatus.status === "known" ? "needs_review" : "missing",
      statusLabel: timeStatus.status === "known" ? "需要人工確認" : "缺少",
      note:
        timeStatus.status === "known"
          ? "有時間線索，但仍要確認是不是最新狀態。"
          : "缺少可判斷有效性的資訊。",
    },
  ];
}

function createConflictGroups(
  records: Phase0MessyRecord[],
  selectedRecord: Phase0MessyRecord,
): Phase0ConflictGroup[] {
  const selectedTopics = getTopics(selectedRecord);

  return selectedTopics
    .map((topic) => {
      const rule = topicRules.find((item) => item.topic === topic);
      const relatedRecords = rule
        ? records.filter((record) => rule.pattern.test(record.rawText))
        : [];

      return {
        topic,
        reason: "同主題出現多筆原始資訊，整理前要一起看，避免只採用其中一句。",
        records: relatedRecords,
      };
    })
    .filter((group) => group.records.length >= 2);
}

function createActionBlockers(
  draft: Phase0Draft | undefined,
  qualityGaps: Phase0QualityGap[],
) {
  const blockers = draft?.blockers ?? [];
  const gapBlockers = qualityGaps
    .filter((gap) => gap.status !== "present")
    .map((gap) => `${gap.label}：${gap.note}`);
  const taskBlocker = draft?.cannotDirectlyBecomeTask
    ? "整理草稿已標示為不能直接變成任務。"
    : "尚未明確標示是否能變成任務，仍需人工確認。";

  return unique([taskBlocker, ...blockers, ...gapBlockers]).slice(0, 8);
}

function createConfirmationQuestions(
  qualityGaps: Phase0QualityGap[],
  conflictGroups: Phase0ConflictGroup[],
) {
  const labels = new Set(
    qualityGaps
      .filter((gap) => gap.status !== "present")
      .map((gap) => gap.label),
  );
  const questions: string[] = [];

  if (labels.has("資訊時間") || labels.has("是否仍有效")) {
    questions.push("請確認這筆資訊現在是否仍有效，以及最後確認時間。");
  }

  if (labels.has("地點可執行性")) {
    questions.push("請確認可公開、可抵達、足夠明確的地點描述。");
  }

  if (labels.has("當事人或回報者") || labels.has("確認者與確認時間")) {
    questions.push("請確認誰是當事人、誰是轉述者、誰能負責查核。");
  }

  if (labels.has("是否可公開")) {
    questions.push("請確認是否取得當事人同意公開必要資訊。");
  }

  if (labels.has("查核狀態")) {
    questions.push("請確認這筆資訊是否仍只能停在候選或需要人工確認。");
  }

  if (conflictGroups.length) {
    questions.push("請先比對同主題紀錄，確認哪些內容只是過期或互相衝突。");
  }

  return unique(questions);
}

function createComparison(
  record: Phase0MessyRecord,
  draft: Phase0Draft | undefined,
): Phase0RawDraftComparison {
  const timeStatus = classifyRecordByTimeStatus(record);
  const topics = getTopics(record);
  const rawSignals = unique([
    `原文編號：${record.id}`,
    `資訊取得方式：${record.sourceType}`,
    `查核狀態：${record.verificationStatus}`,
    timeStatus.status === "known"
      ? `原文明確時間：${timeStatus.timeLabel}`
      : `時間狀態：${timeStatus.timeLabel}`,
    topics.length ? `原文主題線索：${topics.join("、")}` : "",
  ]);
  const draftClaims = draft
    ? [
        `草稿摘要：${draft.summary}`,
        `候選類型：${draft.possibleKind}`,
        `可信度標記：${draft.trustLevel}，分數 ${draft.trustScore.toFixed(1)} / 10`,
        `整理筆記：${draft.note}`,
      ]
    : ["尚未選到整理草稿。"];

  return {
    rawSignals,
    draftClaims,
    reviewWarnings: [
      "草稿內容是整理輔助，不是整理後資料。",
      "若草稿出現原文沒有的地點、時間、人物或任務條件，必須先人工修正。",
      "需要人工確認的資訊不得被顯示成已確認。",
    ],
  };
}

export function createOrganizerInsight({
  records,
  selectedRecord,
  selectedDraft,
}: {
  records: Phase0MessyRecord[];
  selectedRecord: Phase0MessyRecord;
  selectedDraft?: Phase0Draft;
}): Phase0OrganizerInsight {
  const qualityGaps = createQualityGaps(selectedRecord);
  const conflictGroups = createConflictGroups(records, selectedRecord);

  return {
    qualityGaps,
    conflictGroups,
    actionBlockers: createActionBlockers(selectedDraft, qualityGaps),
    confirmationQuestions: createConfirmationQuestions(
      qualityGaps,
      conflictGroups,
    ),
    comparison: createComparison(selectedRecord, selectedDraft),
  };
}
