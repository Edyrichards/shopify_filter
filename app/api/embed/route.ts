import { NextResponse } from "next/server"
import { SHOPIFY_CONFIG } from "@/lib/config"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get("shop")

  if (!shop) {
    return NextResponse.json({ error: "Shop parameter required" }, { status: 400 })
  }

  // Generate embed script for the customer's storefront
  const embedScript = `
(function() {
  // Load Boost Search Widget
  const script = document.createElement('script');
  script.src = '${process.env.HOST}/embed/boost-search.js';
  script.dataset.shop = '${shop}';
  script.dataset.apiKey = '${SHOPIFY_CONFIG.API_KEY}';
  document.head.appendChild(script);
  
  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '${process.env.HOST}/embed/boost-search.css';
  document.head.appendChild(link);
})();
  `

  return new NextResponse(embedScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
