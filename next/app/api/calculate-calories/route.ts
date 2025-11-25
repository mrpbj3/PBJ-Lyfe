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
    const body = await request.json();
    const { mealsDescription } = body;

    if (!mealsDescription || typeof mealsDescription !== "string") {
      return Response.json(
        { error: "Meals description is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openai = getOpenAI();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert. Analyze the meals described and estimate the total calories, protein, fat, and carbs. 
          Respond ONLY with a JSON object in this exact format:
          {"calories": number, "protein": number, "fat": number, "carbs": number}
          All values should be integers. Be reasonably accurate based on typical portion sizes.`,
        },
        {
          role: "user",
          content: mealsDescription,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    
    if (!content) {
      return Response.json(
        { error: "Failed to get AI response" },
        { status: 500 }
      );
    }

    try {
      const parsed = JSON.parse(content);
      return Response.json({
        calories: parsed.calories || 0,
        protein: parsed.protein || 0,
        fat: parsed.fat || 0,
        carbs: parsed.carbs || 0,
      });
    } catch {
      // Try to extract numbers from the response if JSON parsing fails
      const calorieMatch = content.match(/calories[:\s]*(\d+)/i);
      return Response.json({
        calories: calorieMatch ? parseInt(calorieMatch[1]) : 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      });
    }
  } catch (error) {
    console.error("AI calculation error:", error);
    return Response.json(
      { error: "Failed to calculate nutrition" },
      { status: 500 }
    );
  }
}
