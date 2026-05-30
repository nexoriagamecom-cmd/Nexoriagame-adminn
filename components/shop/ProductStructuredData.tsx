export default function ProductStructuredData({ product }: { product: any }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nom,
    description: product.description?.slice(0, 160),
    image: product.images?.[0],
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: product.prix,
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
