import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/env";
const APP_KEY = "sk-test";
const METERING_URL = env.NEXT_PUBLIC_MULERUN_URL;
const API_TOKEN = env.NEXT_PUBLIC_MULERUN_API_KEY;

/* -------------- 原验证逻辑 -------------- */
function verifySignature(body: any): boolean {
  const { signature, ...params } = body;
  const sorted = JSON.stringify(params, Object.keys(params).sort());
  const expect = crypto
    .createHmac("sha256", APP_KEY)
    .update(sorted)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expect));
}

/* -------------- 上报封装 -------------- */
async function reportUsage(
  agentId: string,
  sessionId: string,
  cost: number, // 传入的 PTC 值
  isFinal = false
) {
  // 第一步：PTC → credit
  const credit = cost * 150;
  console.log(`换算后 credit: ${credit}`);

  // 第二步：credit → MuleRun cost 单位 (0.0001 credits)
  // 根据文档：cost 单位是 0.0001 credits
  // 所以：credit × 10000 = MuleRun cost units
  const mulerunCost = Math.round(credit * 10000);
  console.log(`MuleRun cost units: ${mulerunCost}`);

  if (mulerunCost <= 0) {
    console.warn(`[MuleRun] mulerunCost=${mulerunCost} <= 0，跳过上报`);
    return { success: true, skipped: true };
  }

  if (credit > 1000) {
    console.warn(`[MuleRun] credit=${credit} > 50，跳过上报`);
    return { success: true, skipped: true };
  }

  const requestBody = {
    agentId,
    sessionId,
    cost: mulerunCost,
    timestamp: new Date().toISOString(),
    isFinal,
    meteringId: crypto.randomUUID(),
  };

  console.log(`发送给 MuleRun 的请求体:`, JSON.stringify(requestBody));

  const res = await fetch(METERING_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* -------------- 路由处理 -------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. 如果是「上报」请求（带有 cost 字段）
    if (typeof body.cost === "number") {
      const { agentId, sessionId, cost, isFinal = false } = body;
      await reportUsage(agentId, sessionId, cost, isFinal);
      return NextResponse.json({ success: true });
    }

    // 2. 否则走原验证流程
    const ok = verifySignature(body);
    return NextResponse.json({ valid: ok, params: ok ? body : null });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { valid: false, error: (e as Error).message },
      { status: 400 }
    );
  }
}
