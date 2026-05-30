import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_ORIGIN = 'https://nexoriagame.com'

// Map des noms de pays → codes ISO
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'france': 'FR', 'belgique': 'BE', 'belgium': 'BE', 'allemagne': 'DE',
  'germany': 'DE', 'espagne': 'ES', 'spain': 'ES', 'italie': 'IT',
  'italy': 'IT', 'portugal': 'PT', 'pays-bas': 'NL', 'netherlands': 'NL',
  'luxembourg': 'LU', 'suisse': 'CH', 'switzerland': 'CH',
  'royaume-uni': 'GB', 'united kingdom': 'GB', 'uk': 'GB',
  'etats-unis': 'US', 'états-unis': 'US', 'united states': 'US', 'usa': 'US',
  'canada': 'CA', 'autriche': 'AT', 'austria': 'AT',
  'danemark': 'DK', 'denmark': 'DK', 'finlande': 'FI', 'finland': 'FI',
  'suede': 'SE', 'suède': 'SE', 'sweden': 'SE', 'norvege': 'NO',
  'norvège': 'NO', 'norway': 'NO', 'irlande': 'IE', 'ireland': 'IE',
  'pologne': 'PL', 'poland': 'PL', 'republique tcheque': 'CZ',
  'czech republic': 'CZ', 'czechia': 'CZ', 'grece': 'GR', 'grèce': 'GR',
  'greece': 'GR', 'roumanie': 'RO', 'romania': 'RO', 'hongrie': 'HU',
  'hungary': 'HU', 'slovaquie': 'SK', 'slovakia': 'SK', 'slovenie': 'SI',
  'slovenia': 'SI', 'croatie': 'HR', 'croatia': 'HR', 'bulgarie': 'BG',
  'bulgaria': 'BG', 'lituanie': 'LT', 'lithuania': 'LT', 'lettonie': 'LV',
  'latvia': 'LV', 'estonie': 'EE', 'estonia': 'EE', 'chypre': 'CY',
  'cyprus': 'CY', 'malte': 'MT', 'malta': 'MT', 'maroc': 'MA',
  'morocco': 'MA', 'tunisie': 'TN', 'tunisia': 'TN', 'algerie': 'DZ',
  'algérie': 'DZ', 'algeria': 'DZ', 'senegal': 'SN', 'sénégal': 'SN',
  'cote d\'ivoire': 'CI', 'côte d\'ivoire': 'CI', 'ivory coast': 'CI',
  'cameroun': 'CM', 'cameroon': 'CM', 'benin': 'BJ', 'bénin': 'BJ',
  'togo': 'TG', 'mali': 'ML', 'niger': 'NE', 'burkina faso': 'BF',
  'guinee': 'GN', 'guinée': 'GN', 'guinea': 'GN', 'gabon': 'GA',
  'congo': 'CG', 'madagascar': 'MG', 'mauritanie': 'MR', 'mauritania': 'MR',
  'bresil': 'BR', 'brésil': 'BR', 'brazil': 'BR', 'mexique': 'MX',
  'mexico': 'MX', 'argentine': 'AR', 'argentina': 'AR', 'colombie': 'CO',
  'colombia': 'CO', 'chili': 'CL', 'chile': 'CL', 'japon': 'JP',
  'japan': 'JP', 'chine': 'CN', 'china': 'CN', 'coree du sud': 'KR',
  'south korea': 'KR', 'inde': 'IN', 'india': 'IN', 'australie': 'AU',
  'australia': 'AU', 'russie': 'RU', 'russia': 'RU', 'turquie': 'TR',
  'turkey': 'TR', 'arabie saoudite': 'SA', 'saudi arabia': 'SA',
  'emirats arabes unis': 'AE', 'émirats arabes unis': 'AE',
  'united arab emirates': 'AE', 'uae': 'AE',
}

function normalizeCountry(raw: string | undefined | null): string {
  if (!raw) return 'FR'
  const trimmed = raw.trim()
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase()
  const key = trimmed.toLowerCase()
  if (COUNTRY_NAME_TO_CODE[key]) return COUNTRY_NAME_TO_CODE[key]
  return 'FR'
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function POST(request: NextRequest) {
  try {
    const { amount, orderId, customerEmail, country, clientInfo, produits } = await request.json()

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Paramètres manquants: amount et orderId sont requis' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const shopId = process.env.SOGECOMMERCE_USER
    const password = process.env.SOGECOMMERCE_PASSWORD

    if (!shopId || !password) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète — variables ENV absentes' },
        { status: 500, headers: corsHeaders() }
      )
    }

    const billingCountry = normalizeCountry(country)
    const auth = Buffer.from(`${shopId}:${password}`).toString('base64')

    const sogeRes = await fetch(
      'https://api-sogecommerce.societegenerale.eu/api-payment/V4/Charge/CreatePayment',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: 'EUR',
          orderId: orderId,
          customer: {
            email: customerEmail || 'client@nexoriagame.com',
            billingDetails: { country: billingCountry },
          },
        }),
      }
    )

    const sogeData = await sogeRes.json()

    if (sogeData.status !== 'SUCCESS') {
      return NextResponse.json(
        {
          error: sogeData.answer?.errorMessage || 'Erreur Sogecommerce',
          errorCode: sogeData.answer?.errorCode,
          detail: sogeData.answer,
        },
        { status: 400, headers: corsHeaders() }
      )
    }

    // ✅ Stocker dans pending_orders pour le webhook
    if (clientInfo && produits) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { error: pendingError } = await supabaseAdmin
        .from('pending_orders')
        .insert({
          reference: orderId,
          client_nom: clientInfo.nom,
          client_email: clientInfo.email,
          client_telephone: clientInfo.telephone || '',
          client_adresse: clientInfo.adresse,
          client_ville: clientInfo.ville,
          client_code_postal: clientInfo.code_postal,
          client_pays: clientInfo.pays,
          produits,
          total: amount,
        })

      if (pendingError) {
        console.error('❌ pending_orders error:', JSON.stringify(pendingError, null, 2))
      } else {
        console.log('✅ pending_orders OK:', orderId)
      }
    }

    return NextResponse.json(
      { formToken: sogeData.answer.formToken },
      { headers: corsHeaders() }
    )

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur serveur', detail: error.message },
      { status: 500, headers: corsHeaders() }
    )
  }
}
