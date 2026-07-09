import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
    delete document.body.dataset.theme;
  });

  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("lets the user switch visual themes", () => {
    const { container } = render(<App />);

    expect(screen.getByRole("button", { name: "熱血漫畫" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "指揮中心" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "報紙剪報" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "夜間終端" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "夜間終端" }));

    expect(screen.getByRole("button", { name: "夜間終端" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(container.querySelector(".theme-terminal")).toBeInTheDocument();
    expect(document.body.dataset.theme).toBe("terminal");
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "進入 v1 開始確認" }),
    ).toHaveAttribute("href", "/v1/");
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("renders the v1 start-confirmation flow at /v1/", () => {
    window.history.pushState({}, "", "/v1/");

    render(<App />);

    expect(screen.getByText("v1 開始確認工作台")).toBeInTheDocument();
    expect(screen.getByText("v1 / 開始確認")).toBeInTheDocument();
    expect(
      screen.getByText(
        "資料仍來自 Phase 0 原始資訊；這不是整理後資料，也沒有任何已確認任務。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("流程判斷")).toBeInTheDocument();
    expect(screen.getByText("低信任注記")).toBeInTheDocument();
    expect(
      screen.getByText("這些注記只說明不能直接相信的原因，不是真偽判定。"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("時間未知").length).toBeGreaterThan(0);
    expect(screen.getAllByText("待確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("轉述").length).toBeGreaterThan(0);
    expect(screen.getByText("判斷紀錄草稿")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "回到 Phase 0" }),
    ).toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("shows organizer-focused source, status, and actionability guidance", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("資訊來源")).toBeInTheDocument();
    expect(screen.getAllByText("查核狀態").length).toBeGreaterThan(0);
    expect(screen.getByText("行動可行性")).toBeInTheDocument();
    expect(
      screen.getAllByText("不能直接成為任務的理由").length,
    ).toBeGreaterThan(0);
  });

  it("shows conservative time status grouping in the workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("時間狀態分類")).toBeInTheDocument();
    expect(screen.getByText("已過期區")).toBeInTheDocument();
    expect(screen.getByText("時間未知")).toBeInTheDocument();
    expect(screen.getByText("依時間排序")).toBeInTheDocument();
    expect(screen.getByText("14:20")).toBeInTheDocument();
  });

  it("shows organizer inspection tools in the workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("整理者檢查面板")).toBeInTheDocument();
    expect(screen.getByText("資料品質缺口表")).toBeInTheDocument();
    expect(screen.getByText("可能衝突提醒")).toBeInTheDocument();
    expect(screen.getByText("人工確認清單")).toBeInTheDocument();
    expect(screen.getByText("原文 vs 整理草稿對照")).toBeInTheDocument();
  });

  it("keeps draft CRUD as learner work instead of starter output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("尚未建立整理草稿")).toBeInTheDocument();
    expect(
      screen.getByText(/請 agent 加上建立、編輯、刪除或重設整理草稿/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/已產生 \d+ 筆安全邊界草稿/),
    ).not.toBeInTheDocument();
  });
});
