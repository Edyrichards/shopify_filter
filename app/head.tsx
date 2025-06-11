export default function Head() {
  return (
    <>
      <title>Shopify Advanced Search & Filter</title>
      <meta name="description" content="Advanced search and filtering for your Shopify store" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

      {/* PWA manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* PWA theme colors */}
      <meta name="theme-color" content="#ffffff" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Shopify Advanced Search" />

      {/* Open Graph / Social Media */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Shopify Advanced Search & Filter" />
      <meta property="og:description" content="Advanced search and filtering for your Shopify store" />
      <meta property="og:site_name" content="Shopify Advanced Search" />

      {/* Security headers */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta
        httpEquiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.shopify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.shopify.com https://cdn.shopify.com; connect-src 'self' https://*.shopify.com;"
      />
    </>
  )
}
