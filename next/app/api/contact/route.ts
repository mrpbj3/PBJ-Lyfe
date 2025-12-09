import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// Email sending function using Resend API
async function sendEmail(to: string, from: string, subject: string, message: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured. Email notification will be skipped.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PBJ Lyfe Contact Form <onboarding@resend.dev>', // Use verified domain in production
        to: to,
        reply_to: from,
        subject: `[Contact Form] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Contact Form Submission</h2>
            <p><strong>From:</strong> ${from}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">
              This message was sent via the PBJ Lyfe contact form at ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

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

    const senderEmail = email || user?.email || 'anonymous@pbjlyfe.com';

    // Store the contact message in Supabase
    const { data: storedMessage, error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        user_id: user?.id || null,
        email: senderEmail,
        subject,
        message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing contact message:', dbError);
      // Continue anyway - we'll still try to send the email
    }

    // Send email notification to mr.pbj@pbjstudios.com
    const emailResult = await sendEmail(
      'mr.pbj@pbjstudios.com',
      senderEmail,
      subject,
      message
    );

    if (!emailResult.success) {
      console.error('Failed to send email notification:', emailResult.error);
      // Log the message so it's not lost
      console.log('Contact form submission (email failed):', {
        email: senderEmail,
        subject,
        message,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log('Email sent successfully to mr.pbj@pbjstudios.com');
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
