// Enhanced webhook setup script with better error handling and validation

const WEBHOOK_ENDPOINTS = [
  {
    topic: "products/create",
    address: `${process.env.HOST}/api/webhooks/products/create`,
    format: "json",
  },
  {
    topic: "products/update",
    address: `${process.env.HOST}/api/webhooks/products/update`,
    format: "json",
  },
  {
    topic: "products/delete",
    address: `${process.env.HOST}/api/webhooks/products/delete`,
    format: "json",
  },
  {
    topic: "inventory_levels/update",
    address: `${process.env.HOST}/api/webhooks/inventory/update`,
    format: "json",
  },
  {
    topic: "app/uninstalled",
    address: `${process.env.HOST}/api/webhooks/app/uninstalled`,
    format: "json",
  },
]

async function validateEnvironment() {
  const required = ["HOST", "SHOPIFY_API_KEY", "SHOPIFY_API_SECRET_KEY"]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  if (!process.env.HOST.startsWith("https://")) {
    throw new Error("HOST must be a valid HTTPS URL for webhooks")
  }
}

async function getExistingWebhooks(shopDomain, accessToken) {
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2023-10/webhooks.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch existing webhooks: ${response.statusText}`)
    }

    const data = await response.json()
    return data.webhooks || []
  } catch (error) {
    console.error("Error fetching existing webhooks:", error)
    return []
  }
}

async function deleteWebhook(shopDomain, accessToken, webhookId) {
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2023-10/webhooks/${webhookId}.json`, {
      method: "DELETE",
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    })

    return response.ok
  } catch (error) {
    console.error(`Error deleting webhook ${webhookId}:`, error)
    return false
  }
}

async function createWebhook(shopDomain, accessToken, webhook) {
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2023-10/webhooks.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ webhook }),
    })

    if (response.ok) {
      const result = await response.json()
      return { success: true, webhook: result.webhook }
    } else {
      const error = await response.text()
      return { success: false, error }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function setupWebhooks(shopDomain, accessToken, options = {}) {
  const { cleanup = false, dryRun = false } = options

  console.log(`${dryRun ? "[DRY RUN] " : ""}Setting up webhooks for ${shopDomain}...`)

  try {
    // Validate environment
    await validateEnvironment()

    // Get existing webhooks
    const existingWebhooks = await getExistingWebhooks(shopDomain, accessToken)
    console.log(`Found ${existingWebhooks.length} existing webhooks`)

    // Clean up existing webhooks if requested
    if (cleanup && !dryRun) {
      console.log("Cleaning up existing webhooks...")
      for (const webhook of existingWebhooks) {
        if (webhook.address && webhook.address.includes(process.env.HOST)) {
          const deleted = await deleteWebhook(shopDomain, accessToken, webhook.id)
          if (deleted) {
            console.log(`🗑️  Deleted webhook: ${webhook.topic} (${webhook.id})`)
          } else {
            console.log(`❌ Failed to delete webhook: ${webhook.topic} (${webhook.id})`)
          }
        }
      }
    }

    // Create new webhooks
    const results = []
    for (const webhook of WEBHOOK_ENDPOINTS) {
      // Check if webhook already exists
      const existing = existingWebhooks.find((w) => w.topic === webhook.topic && w.address === webhook.address)

      if (existing) {
        console.log(`✅ Webhook already exists: ${webhook.topic}`)
        results.push({ topic: webhook.topic, status: "exists", id: existing.id })
        continue
      }

      if (dryRun) {
        console.log(`[DRY RUN] Would create webhook: ${webhook.topic} -> ${webhook.address}`)
        results.push({ topic: webhook.topic, status: "would_create" })
        continue
      }

      const result = await createWebhook(shopDomain, accessToken, webhook)

      if (result.success) {
        console.log(`✅ Created webhook: ${webhook.topic} (${result.webhook.id})`)
        results.push({
          topic: webhook.topic,
          status: "created",
          id: result.webhook.id,
          address: result.webhook.address,
        })
      } else {
        console.error(`❌ Failed to create webhook: ${webhook.topic}`)
        console.error(`   Error: ${result.error}`)
        results.push({ topic: webhook.topic, status: "failed", error: result.error })
      }

      // Add delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Summary
    console.log("\n📊 Webhook Setup Summary:")
    console.log(`   Created: ${results.filter((r) => r.status === "created").length}`)
    console.log(`   Existing: ${results.filter((r) => r.status === "exists").length}`)
    console.log(`   Failed: ${results.filter((r) => r.status === "failed").length}`)

    const failed = results.filter((r) => r.status === "failed")
    if (failed.length > 0) {
      console.log("\n❌ Failed webhooks:")
      failed.forEach((f) => console.log(`   - ${f.topic}: ${f.error}`))
      return false
    }

    console.log("\n🎉 Webhook setup completed successfully!")
    return true
  } catch (error) {
    console.error("❌ Webhook setup failed:", error.message)
    return false
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2)
  const shopDomain = args[0]
  const accessToken = args[1]

  const options = {
    cleanup: args.includes("--cleanup"),
    dryRun: args.includes("--dry-run"),
  }

  if (!shopDomain || !accessToken) {
    console.error("Usage: node setup-webhooks-enhanced.js <shop-domain> <access-token> [--cleanup] [--dry-run]")
    console.error("Example: node setup-webhooks-enhanced.js example.myshopify.com shpat_xxxxx")
    process.exit(1)
  }

  setupWebhooks(shopDomain, accessToken, options)
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error("Unexpected error:", error)
      process.exit(1)
    })
}

module.exports = { setupWebhooks }
