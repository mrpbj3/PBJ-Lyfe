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
    const { date, rating, why } = body;

    if (!date || !rating) {
      return NextResponse.json(
        { message: 'date and rating are required' },
        { status: 400 }
      );
    }

    // Upsert into daily_summary table
    const { data, error } = await supabase
      .from('daily_summary')
      .upsert({
        user_id: user.id,
        for_date: date,
        mental_rating: rating,
        mental_note: why || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,for_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving mental rating:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in mental API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
