import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, hobby, durationMin } = body;

    if (!date || !hobby) {
      return NextResponse.json(
        { message: 'date and hobby are required' },
        { status: 400 }
      );
    }

    // Upsert into daily_summary table
    const { data: summaryData, error } = await supabase
      .from('daily_summary')
      .upsert({
        user_id: user.id,
        for_date: date,
        hobby_activity: hobby,
        hobby_minutes: durationMin || 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,for_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving hobby:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('Error in hobbies API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
