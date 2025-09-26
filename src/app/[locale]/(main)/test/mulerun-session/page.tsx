"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function MuleRunSessionPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 把参数存起来，后面上报要用
  const [agentId, setAgentId] = useState("");
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    setAgentId(params.agentId);
    setSessionId(params.sessionId);

    fetch("/api/verify-mulerun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) {
          alert("非法请求");
          return;
        }
        console.log("✅ MuleRun 验证通过", data);
      })
      .catch((e) => console.error(e));
  }, [searchParams]);

  // 模拟生图 + 上报
  const handleGenerate = async () => {
    setLoading(true);
    setMsg("正在生成图片...");

    await new Promise((r) => setTimeout(r, 2000)); // 模拟生图 2s

    const cost = 10000; // ✅ 固定扣 1 积分
    try {
      const res = await fetch("/api/verify-mulerun", {
        // ✅ 不再用 /api/report-usage
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          sessionId,
          cost: 10000,
          isFinal: false,
        }),
      });
      console.log("res:", res);
      if (!res.ok) throw new Error("上报失败");
      setMsg(`✅ 生成完成！已固定扣除 1 积分（cost=10000）`);
    } catch (e: any) {
      setMsg(`❌ 上报失败：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }} className="w-full">
      <h1>AI 图片生成器（MuleRun 模拟）</h1>
      <p>会话 ID：{sessionId || "加载中..."}</p>

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "生成中..." : "模拟生成图片"}
      </button>

      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}
    </div>
  );
}
