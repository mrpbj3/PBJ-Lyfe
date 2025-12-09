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
    const { date, calories, proteinG, fatG, carbsG, notes } = body;

    if (!date || calories == null) {
      return NextResponse.json(
        { message: 'date and calories are required' },
        { status: 400 }
      );
    }

    // Upsert into daily_summary table
    const { data: summaryData, error } = await supabase
      .from('daily_summary')
      .upsert({
        user_id: user.id,
        for_date: date,
        calories: calories,
        protein_g: proteinG || null,
        fat_g: fatG || null,
        carbs_g: carbsG || null,
        meals_note: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,for_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving meals:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('Error in meals API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
