import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mealsDescription } = body;

    if (!mealsDescription || mealsDescription.trim() === '') {
      return NextResponse.json(
        { message: 'Meals description is required' },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { message: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    const model = process.env.OPENAI_MODEL_MEALS || 'gpt-4o-mini';

    const prompt = `You are a nutrition expert. Analyze this meal description and provide calorie and macronutrient estimates.

Meal description: "${mealsDescription}"

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{"calories": number, "protein": number, "fat": number, "carbs": number}

Use your best nutritional knowledge to estimate reasonable values. All values should be integers.`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    
    console.log('OpenAI raw response:', content);
    
    // Try to parse the JSON response
    let parsed;
    try {
      // Remove any markdown formatting if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanedContent);
      
      console.log('Parsed nutrition data:', parsed);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { message: 'Failed to parse AI response. Raw content: ' + content },
        { status: 500 }
      );
    }

    // Validate parsed data has required fields
    if (parsed.calories == null || parsed.protein == null || parsed.fat == null || parsed.carbs == null) {
      console.error('Missing required nutrition fields:', parsed);
      return NextResponse.json(
        { message: 'AI response missing required nutrition fields', data: parsed },
        { status: 500 }
      );
    }

    const result = {
      calories: Math.round(Number(parsed.calories) || 0),
      protein: Math.round(Number(parsed.protein) || 0),
      fat: Math.round(Number(parsed.fat) || 0),
      carbs: Math.round(Number(parsed.carbs) || 0),
    };
    
    console.log('Returning nutrition data:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating nutrition with AI:', error);
    return NextResponse.json(
      { message: 'Failed to calculate nutrition' },
      { status: 500 }
    );
  }
}
