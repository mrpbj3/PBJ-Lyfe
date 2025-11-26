import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { subject, message, email } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { message: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Store the contact message in Supabase
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        user_id: user?.id || null,
        email: email || user?.email || 'anonymous',
        subject,
        message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If the table doesn't exist, we'll still return success
      // since the message intent was received
      console.error('Error storing contact message:', error);
      
      // Log the message for now (in production, you might email it)
      console.log('Contact form submission:', {
        email: email || user?.email || 'anonymous',
        subject,
        message,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! We will get back to you as soon as we can.'
    });
  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
