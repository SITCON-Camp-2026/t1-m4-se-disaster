import { describe, expect, it } from "vitest";
import messyReports from "../src/fixtures/phase-0/messy-reports.json";
import {
  createPhase0Drafts,
  createPhase0Judgement,
} from "../src/features/phase-0/phase0-heuristics";
import { filterDraftsByQuery } from "../src/features/phase-0/phase0-draft-search";
import { createOrganizerInsight } from "../src/features/phase-0/organizer-insights";
import {
  classifyRecordByTimeStatus,
  groupRecordsByTimeStatus,
} from "../src/features/phase-0/time-status";

describe("phase 0 heuristics", () => {
  it("loads the current phase 0 messy data", () => {
    expect(messyReports).toHaveLength(12);
    expect(messyReports.map((record) => record.id)).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `M-${String(index + 1).padStart(3, "0")}`,
      ),
    );
  });

  it("creates conservative safety placeholders for all records", () => {
    const judgements = messyReports.map(createPhase0Judgement);

    expect(judgements).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.unsafeToActDirectly),
    ).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.possibleKind === "unknown"),
    ).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.confidence === "low"),
    ).toHaveLength(messyReports.length);
  });

  it("does not treat review-needed records as confirmed facts", () => {
    const judgement = createPhase0Judgement(messyReports[9]);

    expect(messyReports[9].verificationStatus).toBe("needs_review");
    expect(judgement.unsafeToActDirectly).toBe(true);
    expect(judgement.evidence.join(" ")).not.toContain("verified");
  });

  it("does not infer candidate kind from the starter text", () => {
    const judgement = createPhase0Judgement(messyReports[10]);

    expect(judgement.possibleKind).toBe("unknown");
    expect(judgement.suggestedNextStep).toBe("send_to_human_review");
  });

  it("creates editable drafts for multiple records with review and task blockers", () => {
    const drafts = createPhase0Drafts(messyReports);

    expect(drafts.length).toBeGreaterThanOrEqual(6);
    expect(
      drafts.filter((draft) => draft.humanReviewNote).length,
    ).toBeGreaterThan(0);
    expect(
      drafts.filter((draft) => draft.cannotDirectlyBecomeTask).length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      drafts.some((draft) => draft.possibleKind === "site_status_candidate"),
    ).toBe(true);
  });

  it("creates varied reasons and marks a couple of drafts as more trustworthy", () => {
    const drafts = createPhase0Drafts(messyReports);

    expect(drafts.some((draft) => draft.trustLevel === "high")).toBe(true);
    expect(
      drafts.filter((draft) => draft.blockers.length >= 2).length,
    ).toBeGreaterThan(2);
    expect(
      drafts.some((draft) =>
        draft.blockers.some((reason) => reason.includes("可信")),
      ),
    ).toBe(true);
  });

  it("groups records from the same source type into the same candidate kind", () => {
    const fieldReportRecords = messyReports.filter(
      (record) => record.sourceType === "field_report",
    );
    const drafts = createPhase0Drafts(fieldReportRecords);

    expect(new Set(drafts.map((draft) => draft.possibleKind)).size).toBe(1);
    expect(drafts[0].possibleKind).toBe("site_status_candidate");
  });

  it("filters drafts by a keyword across summary, note, review notes, and blockers", () => {
    const drafts = createPhase0Drafts(messyReports);
    const filtered = filterDraftsByQuery(drafts, "資訊");

    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        (draft) =>
          draft.summary.includes("資訊") ||
          draft.note.includes("資訊") ||
          draft.humanReviewNote?.includes("資訊") ||
          draft.blockers.some((reason) => reason.includes("資訊")),
      ),
    ).toBe(true);
  });

  it("groups time status conservatively without treating updatedAt as validity", () => {
    const groups = groupRecordsByTimeStatus(messyReports);

    expect(groups.expired.map((item) => item.record.id)).toEqual([
      "M-002",
      "M-003",
      "M-005",
      "M-007",
    ]);
    expect(groups.unknown.some((item) => item.record.id === "M-001")).toBe(
      true,
    );
    expect(groups.known.map((item) => item.record.id)).toEqual([
      "M-009",
      "M-010",
    ]);
    expect(groups.known.map((item) => item.timeLabel)).toEqual([
      "14:20",
      "14:35",
    ]);
  });

  it("puts records without a marked information time into time unknown", () => {
    const classified = classifyRecordByTimeStatus({
      id: "M-test",
      rawText: "現場說可能需要協助，但沒有標示時間。",
      sourceType: "field_report",
      verificationStatus: "needs_review",
    });

    expect(classified.status).toBe("unknown");
    expect(classified.timeLabel).toBe("未標示時間");
  });

  it("creates organizer insights without turning gaps into confirmed facts", () => {
    const drafts = createPhase0Drafts(messyReports);
    const insight = createOrganizerInsight({
      records: messyReports,
      selectedRecord: messyReports[9],
      selectedDraft: drafts[9],
    });

    expect(insight.qualityGaps.map((gap) => gap.label)).toContain("資訊時間");
    expect(
      insight.conflictGroups.some((group) => group.topic.includes("雨鞋")),
    ).toBe(true);
    expect(insight.confirmationQuestions.length).toBeGreaterThan(0);
    expect(insight.comparison.reviewWarnings.join(" ")).toContain(
      "不得被顯示成已確認",
    );
  });
});
