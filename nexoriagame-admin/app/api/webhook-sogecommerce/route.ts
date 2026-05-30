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
    console.log('🔔 IPN reçue (brute) :', body)

    // Parser l'URL-encoded
    const params = new URLSearchParams(body)
    const krAnswerRaw = params.get('kr-answer') || ''
    const krHash = params.get('kr-hash') || ''
    const krHashAlgorithm = params.get('kr-hash-algorithm') || 'sha256'

    // Décoder l'URL-encoding de kr-answer
    const krAnswerDecoded = decodeURIComponent(krAnswerRaw)

    console.log('🔑 HMAC KEY utilisée :', SOGE_HMAC_KEY?.substring(0, 10) + '...')
    console.log('📝 kr-answer décodé :', krAnswerDecoded?.substring(0, 100))

    // ✅ FIX : SogEcommerce signe sur kr-answer DÉCODÉ + HMAC_KEY
    const stringToHash = krAnswerDecoded + SOGE_HMAC_KEY
    const expectedHash = crypto
      .createHash(krHashAlgorithm === 'sha256' ? 'sha256' : 'sha256')
      .update(stringToHash, 'utf8')
      .digest('hex')

    console.log('🔑 Hash reçu    :', krHash)
    console.log('🔑 Hash attendu :', expectedHash)

    if (krHash !== expectedHash) {
      console.log('❌ Signature invalide')
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    // Parser le JSON de kr-answer
    const krAnswer = JSON.parse(krAnswerDecoded)
    const orderId = krAnswer.orderDetails?.orderId
    const status = krAnswer.orderDetails?.orderStatus
    const detailedStatus = krAnswer.transactions?.[0]?.detailedStatus

    console.log('📦 orderId:', orderId)
    console.log('📦 status:', status)
    console.log('📦 detailedStatus:', detailedStatus)

    if (!orderId) {
      console.error('❌ orderId manquant dans kr-answer')
      return NextResponse.json({ error: 'orderId manquant' }, { status: 400 })
    }

    // Mettre à jour la commande si le paiement est autorisé
    if (status === 'PAID' || detailedStatus === 'AUTHORISED') {
      const { data, error: updateError } = await supabaseAdmin
        .from('commandes')
        .update({ statut: 'payee' })
        .eq('reference', orderId)
        .select()

      if (updateError) {
        console.error('❌ Erreur mise à jour commande :', updateError.message)
      } else if (!data || data.length === 0) {
        // ✅ La commande n'existe pas encore → on l'insère depuis kr-answer
        console.log('⚠️ Commande introuvable, tentative d insertion depuis kr-answer...')
        const transaction = krAnswer.transactions?.[0]
        const { error: insertError } = await supabaseAdmin
          .from('commandes')
          .insert({
            reference: orderId,
            client_email: krAnswer.customer?.email || 'inconnu@nexoriagame.com',
            total: (transaction?.amount || 0) / 100,
            statut: 'payee',
            mode_paiement: 'sogecommerce',
            produits: [],
          })
        if (insertError) {
          console.error('❌ Erreur insertion commande :', insertError.message)
        } else {
          console.log('✅ Commande insérée depuis IPN :', orderId)
        }
      } else {
        console.log('✅ Commande mise à jour :', orderId)
      }
    } else {
      console.log('ℹ️ Statut ignoré :', status || detailedStatus)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Erreur webhook :', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
