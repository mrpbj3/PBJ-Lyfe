import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import OpenAI from "openai";

// Lazy initialize OpenAI client
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();

  // MUST authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    const openai = getOpenAI();

    // Use GPT-4 Vision to read the scale
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an OCR assistant that reads weight values from scale displays. 
          Extract the weight number shown on the scale. 
          Respond ONLY with a JSON object in this format:
          {"weight": number, "unit": "lbs" | "kg" | "unknown"}
          If you cannot detect a weight, respond with:
          {"weight": null, "unit": null, "error": "Could not detect weight"}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Read the weight displayed on this scale photo. Extract the numeric weight value.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      return Response.json(
        { error: "Failed to process image" },
        { status: 500 }
      );
    }

    try {
      const parsed = JSON.parse(content);
      return Response.json({
        weight: parsed.weight,
        unit: parsed.unit,
        error: parsed.error,
      });
    } catch {
      // Try to extract number from response
      const match = content.match(/(\d+\.?\d*)/);
      if (match) {
        return Response.json({
          weight: parseFloat(match[1]),
          unit: "unknown",
        });
      }
      return Response.json({
        weight: null,
        unit: null,
        error: "Could not parse weight from image",
      });
    }
  } catch (error) {
    console.error("OCR error:", error);
    return Response.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
