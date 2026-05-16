import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { code?: string }
  const { code } = body

  if (!code?.trim()) return NextResponse.json({ valid: false })

  const stripe = getStripe()
  const results = await stripe.promotionCodes.list({
    code: code.trim().toUpperCase(),
    active: true,
    limit: 1,
  })

  if (results.data.length === 0) {
    return NextResponse.json({ valid: false })
  }

  const promoCode = results.data[0] as unknown as {
    id: string
    promotion?: { coupon?: string; type?: string }
  }
  const couponId = promoCode.promotion?.coupon
  if (!couponId) return NextResponse.json({ valid: false })

  const coupon = await stripe.coupons.retrieve(couponId)
  const isFree = coupon.percent_off === 100 && coupon.duration === 'forever'

  return NextResponse.json({
    valid: true,
    isFree,
    promoCodeId: promoCode.id,
  })
}
