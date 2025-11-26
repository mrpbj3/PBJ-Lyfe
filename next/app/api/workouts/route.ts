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
    const { date, startAt, endAt, exercises, workoutType, strengthExercises, cardioExercises, notes } = body;

    if (!date) {
      return NextResponse.json(
        { message: 'date is required' },
        { status: 400 }
      );
    }

    // Calculate workout duration in minutes
    let workoutMinutes = 0;
    if (startAt && endAt) {
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      workoutMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    }

    // Combine exercises into a note
    let workoutNote = '';
    if (exercises && Array.isArray(exercises)) {
      workoutNote = exercises.join('\n');
    }
    if (strengthExercises && Array.isArray(strengthExercises)) {
      workoutNote += (workoutNote ? '\n\nStrength:\n' : 'Strength:\n') + strengthExercises.join('\n');
    }
    if (cardioExercises && Array.isArray(cardioExercises)) {
      workoutNote += (workoutNote ? '\n\nCardio:\n' : 'Cardio:\n') + cardioExercises.join('\n');
    }
    if (notes) {
      workoutNote += (workoutNote ? '\n\nNotes: ' : 'Notes: ') + notes;
    }

    // Upsert into daily_summary table
    const { data, error } = await supabase
      .from('daily_summary')
      .upsert({
        user_id: user.id,
        for_date: date,
        workout_minutes: workoutMinutes,
        workout_note: workoutNote || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,for_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving workout:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in workouts API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get recent workouts from daily_summary
    const { data, error } = await supabase
      .from('daily_summary')
      .select('for_date, workout_minutes, workout_note')
      .eq('user_id', user.id)
      .gt('workout_minutes', 0)
      .order('for_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching workouts:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Transform data to expected format
    const workouts = (data || []).map(row => ({
      date: row.for_date,
      workout_minutes: row.workout_minutes,
      workout_note: row.workout_note,
    }));

    return NextResponse.json(workouts);
  } catch (error) {
    console.error('Error in workouts GET API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
