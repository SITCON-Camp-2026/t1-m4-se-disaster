import type { Phase0MessyRecord } from "./phase0-types";

export type Phase0TimeStatus = "expired" | "unknown" | "known";

export type Phase0TimeClassifiedRecord = {
  record: Phase0MessyRecord;
  status: Phase0TimeStatus;
  timeLabel: string;
  reason: string;
  sortValue: number;
};

export type Phase0TimeStatusGroups = {
  expired: Phase0TimeClassifiedRecord[];
  unknown: Phase0TimeClassifiedRecord[];
  known: Phase0TimeClassifiedRecord[];
};

type ClockTime = {
  label: string;
  sortValue: number;
};

const expiredSignalRules: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /昨天|今天沒空|沒空/,
    reason: "原文提到昨天或今天沒空，這類資訊可能已經失效。",
  },
  {
    pattern: /沒更新|可能沒更新|原本那張單/,
    reason: "原文指出既有清單或資訊可能沒有更新，應先放入已過期區。",
  },
  {
    pattern: /不知道.*還有沒有|下午還有沒有/,
    reason: "原文只提到較早狀態，且明確說後續是否仍有效未知。",
  },
  {
    pattern: /中午前|截圖是哪一天/,
    reason: "原文有截止語句或截圖日期不明，不能當成仍有效的資訊。",
  },
];

function compareByRecordId(
  first: Phase0TimeClassifiedRecord,
  second: Phase0TimeClassifiedRecord,
) {
  return first.record.id.localeCompare(second.record.id, "zh-TW");
}

function compareBySortTime(
  first: Phase0TimeClassifiedRecord,
  second: Phase0TimeClassifiedRecord,
) {
  if (first.sortValue !== second.sortValue) {
    return first.sortValue - second.sortValue;
  }

  return compareByRecordId(first, second);
}

function extractClockTimes(rawText: string): ClockTime[] {
  const matches = rawText.matchAll(
    /(?:^|[^\d])([01]?\d|2[0-3])[:：]([0-5]\d)(?!\d)/g,
  );

  return [...matches].map((match) => {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    return {
      label,
      sortValue: hour * 60 + minute,
    };
  });
}

function getExpiredSignalReason(rawText: string) {
  return expiredSignalRules.find((rule) => rule.pattern.test(rawText))?.reason;
}

export function classifyRecordByTimeStatus(
  record: Phase0MessyRecord,
): Phase0TimeClassifiedRecord {
  const clockTimes = extractClockTimes(record.rawText);
  const firstClockTime = clockTimes[0];
  const expiredReason = getExpiredSignalReason(record.rawText);

  if (expiredReason) {
    return {
      record,
      status: "expired",
      timeLabel: firstClockTime?.label ?? "原文有過期線索",
      reason: `${expiredReason} 這只是保守分類，仍需人工確認。`,
      sortValue: firstClockTime?.sortValue ?? Number.MAX_SAFE_INTEGER,
    };
  }

  if (firstClockTime) {
    return {
      record,
      status: "known",
      timeLabel: firstClockTime.label,
      reason: "原文有明確時間，且目前沒有看到過期線索；仍不可視為已確認。",
      sortValue: firstClockTime.sortValue,
    };
  }

  return {
    record,
    status: "unknown",
    timeLabel: record.updatedAt ? "原文未標示明確資訊時間" : "未標示時間",
    reason: "原文缺少可排序的資訊時間，不能只用更新時間判斷現場狀態是否有效。",
    sortValue: Number.MAX_SAFE_INTEGER,
  };
}

export function groupRecordsByTimeStatus(
  records: Phase0MessyRecord[],
): Phase0TimeStatusGroups {
  const classifiedRecords = records.map(classifyRecordByTimeStatus);

  return {
    expired: classifiedRecords
      .filter((item) => item.status === "expired")
      .sort(compareBySortTime),
    unknown: classifiedRecords
      .filter((item) => item.status === "unknown")
      .sort(compareByRecordId),
    known: classifiedRecords
      .filter((item) => item.status === "known")
      .sort(compareBySortTime),
  };
}
