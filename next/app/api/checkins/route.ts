import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, answers } = body;

    if (!date) {
      return NextResponse.json({ error: 'Missing required field: date' }, { status: 400 });
    }

    // Insert or update daily_checkin record
    const { data: checkin, error: checkinError } = await supabase
      .from('daily_checkins')
      .upsert({
        user_id: user.id,
        for_date: date,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,for_date'
      })
      .select()
      .single();

    if (checkinError) {
      console.error('Error saving daily check-in:', checkinError);
      return NextResponse.json({ error: checkinError.message }, { status: 500 });
    }

    // If answers provided, save them to daily_checkin_answers table
    if (answers && Array.isArray(answers) && answers.length > 0) {
      const answersToInsert = answers.map((answer: any) => ({
        checkin_id: checkin.id,
        question_key: answer.question_key,
        answer_value: answer.answer_value,
        created_at: new Date().toISOString(),
      }));

      const { error: answersError } = await supabase
        .from('daily_checkin_answers')
        .insert(answersToInsert);

      if (answersError) {
        console.error('Error saving check-in answers:', answersError);
        // Don't fail the whole request if answers fail
      }
    }

    return NextResponse.json({ success: true, checkin });
  } catch (error) {
    console.error('Daily check-in POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
