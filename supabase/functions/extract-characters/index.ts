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
    const { chapterTitle, chapterContent, bookTitle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contentPreview = Array.isArray(chapterContent)
      ? chapterContent.slice(0, 50).join("\n")
      : String(chapterContent).slice(0, 3000);

    const systemPrompt = `你是一个小说分析助手。根据给定的章节内容，提取出现的主要角色（2-5个），返回JSON数组。

每个角色包含：
- name: 角色名字
- mood: 当前章节中该角色的情绪状态（简短描述）
- persona: 角色的性格和说话风格描述（用于AI扮演）
- knownEvents: 该角色在本章节中已知的事件（数组，每项简短描述）

只返回JSON数组，不要其他文字。`;

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
            {
              role: "user",
              content: `小说：《${bookTitle}》\n章节：${chapterTitle}\n\n内容：\n${contentPreview}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_characters",
                description: "Extract characters from a novel chapter",
                parameters: {
                  type: "object",
                  properties: {
                    characters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          mood: { type: "string" },
                          persona: { type: "string" },
                          knownEvents: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                        required: ["name", "mood", "persona", "knownEvents"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["characters"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_characters" },
          },
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
          JSON.stringify({ error: "AI 额度不足。" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ characters: parsed.characters }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-characters error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
