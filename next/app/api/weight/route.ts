import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the most recent weight entry
    const { data, error } = await supabase
      .from('body_metrics')
      .select('date, weight_kg')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching weight:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the latest weight entry (or empty array if none)
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Weight GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, weightKg } = body;

    if (!date || weightKg === undefined || weightKg === null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert to body_metrics table
    const { data, error } = await supabase
      .from('body_metrics')
      .upsert({
        user_id: user.id,
        date: date,
        weight_kg: weightKg,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date'
      });

    if (error) {
      console.error('Error saving weight:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Weight POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
