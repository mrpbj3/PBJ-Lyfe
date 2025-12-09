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
    const { date, drugName, amount, isPrescribed } = body;

    if (!date || !drugName) {
      return NextResponse.json(
        { message: 'date and drugName are required' },
        { status: 400 }
      );
    }

    // Insert drug use log
    const { data: logData, error } = await supabase
      .from('drug_use_logs')
      .insert({
        user_id: user.id,
        for_date: date,
        drug_name: drugName,
        amount: amount || null,
        is_prescribed: isPrescribed || false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving drug use log:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Also update daily_summary to set drug_use_flag = true
    await supabase
      .from('daily_summary')
      .upsert({
        user_id: user.id,
        for_date: date,
        drug_use_flag: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,for_date'
      });

    return NextResponse.json(logData);
  } catch (error) {
    console.error('Error in drug-use API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
