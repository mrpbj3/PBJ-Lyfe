import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { message: 'Message is required' },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      // Return a helpful message if OpenAI is not configured
      return NextResponse.json({
        response: "I'm sorry, but my AI capabilities are currently unavailable. The OpenAI API key is not configured. Please contact support or try again later."
      });
    }

    // Fetch user's profile and recent data for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: recentSummaries } = await supabase
      .from('daily_summary')
      .select('*')
      .eq('user_id', user.id)
      .order('for_date', { ascending: false })
      .limit(7);

    // Build context about the user
    let userContext = '';
    if (profile) {
      userContext += `User Profile:\n`;
      if (profile.first_name) userContext += `- Name: ${profile.first_name}\n`;
      if (profile.calorie_target) userContext += `- Daily calorie goal: ${profile.calorie_target} kcal\n`;
      if (profile.sleep_target_minutes) userContext += `- Sleep goal: ${profile.sleep_target_minutes} minutes per night\n`;
      if (profile.workout_days_target) userContext += `- Workout goal: ${profile.workout_days_target} days per week\n`;
      if (profile.in_recovery) userContext += `- Currently in recovery\n`;
    }

    if (recentSummaries && recentSummaries.length > 0) {
      userContext += `\nRecent Activity (last 7 days):\n`;
      recentSummaries.forEach((summary: any) => {
        userContext += `- ${summary.for_date}: `;
        const activities = [];
        if (summary.sleep_hours) activities.push(`${summary.sleep_hours}h sleep`);
        if (summary.workout_minutes) activities.push(`${summary.workout_minutes}min workout`);
        if (summary.calories_consumed) activities.push(`${summary.calories_consumed} kcal`);
        if (summary.mental_rating) activities.push(`mood: ${summary.mental_rating}`);
        userContext += activities.join(', ') || 'No data';
        userContext += '\n';
      });
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    const model = process.env.OPENAI_MODEL_COACH || 'gpt-4o-mini';

    const systemPrompt = `You are Mr. PBJ, a friendly and supportive AI health coach for the PBJ Lyfe wellness app. Your role is to:

1. Provide personalized health advice based on the user's data and goals
2. Motivate and encourage users in their health journey
3. Answer questions about nutrition, exercise, sleep, mental health, and recovery
4. Analyze trends in their health data and provide insights
5. Help users set and achieve realistic health goals

Be warm, encouraging, and supportive. Use simple language. Keep responses concise but helpful (2-3 paragraphs max unless they ask for more detail).

${userContext}

Remember: You're a coach, not a doctor. For serious health concerns, always recommend consulting a healthcare professional.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (history && Array.isArray(history)) {
      history.forEach((msg: { role: string; content: string }) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    // Add the current message
    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({
      response: responseContent
    });
  } catch (error) {
    console.error('Error in coach API:', error);
    return NextResponse.json(
      { 
        response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
      },
      { status: 200 } // Return 200 with error message so UI can display it
    );
  }
}
