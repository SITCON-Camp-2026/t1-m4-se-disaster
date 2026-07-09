import { useEffect, useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";
import { V1FlowWorkbench } from "../features/v1/V1FlowWorkbench";

type TabKey = "raw" | "workbench";
type ThemeKey = "comic" | "command" | "newspaper" | "terminal";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "原始資訊" },
  { key: "workbench", label: "整理工作台" },
];

const themes: Array<{ key: ThemeKey; label: string }> = [
  { key: "comic", label: "熱血漫畫" },
  { key: "command", label: "指揮中心" },
  { key: "newspaper", label: "報紙剪報" },
  { key: "terminal", label: "夜間終端" },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];
const appBase = import.meta.env.BASE_URL;
const v1Href = `${appBase}v1/`;

function isV1Route() {
  return /\/v1\/?$/.test(window.location.pathname);
}

export function App() {
  const isV1 = isV1Route();
  const [activeTab, setActiveTab] = useState<TabKey>("raw");
  const [theme, setTheme] = useState<ThemeKey>("comic");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );

  useEffect(() => {
    document.body.dataset.theme = theme;

    return () => {
      delete document.body.dataset.theme;
    };
  }, [theme]);

  function selectForWorkbench(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab("workbench");
  }

  return (
    <main className={`layout theme-${theme}`}>
      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>{isV1 ? "v1 開始確認工作台" : "災害資訊整理工作台"}</h1>
        <p>
          {isV1
            ? "依照 docs/flow.md，把 Phase 0 原始資訊放進開始確認流程，先看缺口、風險與候選草稿邊界。"
            : "第一階段先用 coding agent 做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。"}
        </p>

        <section className="theme-switcher" aria-label="切換視覺風格">
          <span>風格</span>
          <div>
            {themes.map((item) => (
              <button
                aria-pressed={theme === item.key}
                className={theme === item.key ? "active" : ""}
                key={item.key}
                type="button"
                onClick={() => setTheme(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </header>

      <nav className="tabs" aria-label="第一階段工作區">
        {isV1 ? (
          <a href={appBase}>回到 Phase 0</a>
        ) : (
          <>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? "active" : ""}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
            <a href={v1Href}>進入 v1 開始確認</a>
          </>
        )}
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : isV1 ? (
          <V1FlowWorkbench
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={setSelectedRecordId}
          />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={selectForWorkbench}
          />
        ) : (
          <Phase0Workbench
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={setSelectedRecordId}
          />
        )}
      </section>
    </main>
  );
}
