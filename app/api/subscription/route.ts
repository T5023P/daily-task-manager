import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  try {
    const { planId, userId, email } = await req.json();

    if (!planId || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: planId === process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ANNUAL ? 10 : 120,
      customer_notify: 1,
      notes: {
        userId,
        email,
      },
    });

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (error: any) {
    console.error('Razorpay subscription error:', error);
    return NextResponse.json(
      { error: error?.error?.description || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
