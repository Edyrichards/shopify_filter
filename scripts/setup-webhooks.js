// Script to set up Shopify webhooks for real-time sync

const WEBHOOK_ENDPOINTS = [
  {
    topic: "products/create",
    address: "https://your-app-domain.com/api/webhooks/products/create",
    format: "json",
  },
  {
    topic: "products/update",
    address: "https://your-app-domain.com/api/webhooks/products/update",
    format: "json",
  },
  {
    topic: "products/delete",
    address: "https://your-app-domain.com/api/webhooks/products/delete",
    format: "json",
  },
  {
    topic: "inventory_levels/update",
    address: "https://your-app-domain.com/api/webhooks/inventory/update",
    format: "json",
  },
]

async function setupWebhooks(shopDomain, accessToken) {
  console.log(`Setting up webhooks for ${shopDomain}...`)

  for (const webhook of WEBHOOK_ENDPOINTS) {
    try {
      const response = await fetch(`https://${shopDomain}/admin/api/2023-07/webhooks.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ webhook }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Created webhook for ${webhook.topic}: ${result.webhook.id}`)
      } else {
        const error = await response.text()
        console.error(`❌ Failed to create webhook for ${webhook.topic}: ${error}`)
      }
    } catch (error) {
      console.error(`❌ Error creating webhook for ${webhook.topic}:`, error)
    }
  }

  console.log("Webhook setup completed!")
}

// Example usage
const shopDomain = "example-shop.myshopify.com"
const accessToken = "your-access-token"

setupWebhooks(shopDomain, accessToken)
