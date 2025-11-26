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
    const { startAt, endAt, dreamType, dreamDescription } = body;

    if (!startAt || !endAt) {
      return NextResponse.json(
        { message: 'startAt and endAt are required' },
        { status: 400 }
      );
    }

    // Calculate sleep hours
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const sleepHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    // Get the date from the endAt (wake up time)
    const forDate = endAt.split('T')[0];

    // Upsert into daily_summary table
    const { data, error } = await supabase
      .from('daily_summary')
      .upsert({
        user_id: user.id,
        for_date: forDate,
        sleep_hours: Math.round(sleepHours * 10) / 10, // Round to 1 decimal
        dream_type: dreamType || 'none',
        dream_desc: dreamDescription || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,for_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving sleep:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in sleep API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
