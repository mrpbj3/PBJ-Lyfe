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
    const { date, drugName, symptoms } = body;

    if (!date || !drugName || !symptoms) {
      return NextResponse.json(
        { message: 'date, drugName, and symptoms are required' },
        { status: 400 }
      );
    }

    // Insert withdrawal note
    const { data: noteData, error } = await supabase
      .from('withdrawal_notes')
      .insert({
        user_id: user.id,
        for_date: date,
        drug_name: drugName,
        symptoms: symptoms,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving withdrawal note:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(noteData);
  } catch (error) {
    console.error('Error in withdrawal API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
