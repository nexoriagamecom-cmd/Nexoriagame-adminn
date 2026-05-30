import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SOGE_HMAC_KEY = process.env.SOGECOMMERCE_HMAC_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log('🔔 IPN brute :', body)

    const params = new URLSearchParams(body)
    const krAnswer = params.get('kr-answer')
    const krHash = params.get('kr-hash')

    if (!krAnswer || !krHash) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // ✅ HMAC-SHA256 (pas simple hash)
    const calculatedHash = crypto
      .createHmac('sha256', SOGE_HMAC_KEY)
      .update(krAnswer)
      .digest('hex')

    console.log('🔑 Hash reçu :', krHash)
    console.log('🔑 Hash calculé :', calculatedHash)

    if (calculatedHash !== krHash) {
      console.log('❌ Signature invalide')
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    // ✅ URLSearchParams décode déjà → pas de decodeURIComponent
    const paymentData = JSON.parse(krAnswer)

    const orderId = paymentData.orderDetails?.orderId
    const status = paymentData.orderDetails?.orderStatus
    const detailedStatus = paymentData.transactions?.[0]?.detailedStatus

    console.log('📦 orderId:', orderId)
    console.log('📦 status:', status)

    if (status === 'PAID' || detailedStatus === 'AUTHORISED' || detailedStatus === 'CAPTURED') {
      // ✅ Anti-doublons avec maybeSingle()
      const { data: existingOrder } = await supabaseAdmin
        .from('commandes')
        .select('id')
        .eq('reference', orderId)
        .maybeSingle()

      if (existingOrder) {
        console.log('⚠️ Commande déjà existante :', orderId)
        return NextResponse.json({ received: true })
      }

      // ✅ Chercher dans pending_orders avec maybeSingle()
      const { data: pending } = await supabaseAdmin
        .from('pending_orders')
        .select('*')
        .eq('reference', orderId)
        .maybeSingle()

      if (pending) {
        const { error: insertError } = await supabaseAdmin
          .from('commandes')
          .insert({
            reference: orderId,
            client_nom: pending.client_nom,
            client_email: pending.client_email,
            client_telephone: pending.client_telephone,
            client_adresse: pending.client_adresse,
            client_ville: pending.client_ville,
            client_code_postal: pending.client_code_postal,
            client_pays: pending.client_pays,
            produits: pending.produits,
            total: pending.total,
            statut: 'payee',
            mode_paiement: 'sogecommerce',
          })

        if (insertError) {
          console.error('❌ Erreur insertion commande:', insertError)
          return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
        }

        await supabaseAdmin.from('pending_orders').delete().eq('reference', orderId)
        console.log('✅ Commande créée :', orderId)
      } else {
        console.log('⚠️ Aucune commande en attente pour :', orderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Erreur webhook :', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
