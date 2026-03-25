import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, characterState, bookTitle, chapterTitle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt from character state
    const systemPrompt = `你现在扮演的是小说《${bookTitle}》中的角色。当前章节：${chapterTitle}。

角色设定：
- 角色名：${characterState.name}
- 当前情绪：${characterState.mood}
- 角色人设：${characterState.persona}

已知事件（你只能谈论这些，不要剧透后续情节）：
${characterState.knownEvents.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n")}

重要规则：
1. 始终保持角色身份，用角色的语气和口吻说话。
2. 只能基于已知事件进行讨论，绝不能剧透后面的剧情。
3. 如果用户引用了小说中的文字，请以角色的视角对这段文字进行评论或回应。
4. 回答要自然流畅，像真人对话，不要过于冗长。每次回复控制在100字以内。
5. 可以适当表达角色的情感和想法，让对话有温度。`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试。" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 额度不足，请充值后继续使用。" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI 服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
