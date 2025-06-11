# Shopify Product Filter Integration

This project is a complete, modular solution to implement advanced product filtering and analytics in a Shopify storefront. Built with **Next.js**, **TypeScript**, and **TailwindCSS**, it also integrates directly with Shopify themes and APIs.

---

## 🚀 Features

- 🔍 Advanced product filtering with Typesense
- ⚡ Real-time inventory and product sync
- 📊 Admin dashboards for analytics and monitoring
- 🔔 Webhook integration for Shopify events
- 🧠 AI-based search & product recommendations
- 🧩 Modular UI components (accordion, checkbox, slider, etc.)
- 🛠 Scripts for setting up database, webhooks, and production environment

---

## 🧱 Folder Structure

```
.
├── app/                          # Main application pages, layouts, and routes
├── components/                  # Modular components (filters, dashboards, sections)
├── components/ui/              # UI primitives (buttons, modals, sliders, tables, etc.)
├── hooks/                       # Custom React hooks
├── lib/                         # Core logic, utilities, Shopify integration
├── public/                      # Static assets (images, icons)
├── scripts/                     # Setup scripts and SQL files
├── styles/                      # Global CSS (Tailwind)
├── shopify-theme/              # Shopify theme snippets and assets
├── shopify-app/                 # Shopify app extension support
├── extensions/                  # Shopify theme app extension files
```

---

## ⚙️ Setup Instructions

1. **Install dependencies** (uses pnpm):

   ```
   pnpm install
   ```

2. **Run the development server**:

   ```
   pnpm dev
   ```

3. **Optional setup scripts**:

   - Webhooks:
     ```
     node scripts/setup-webhooks.js
     ```

   - Database:
     ```
     node scripts/create-database.sql
     ```

---

## 🔍 Key Components

- `components/product-filter-demo.tsx`: Base product filter component
- `components/advanced-filters.tsx`: Advanced filtering with dynamic UI
- `lib/product-filter.ts`: Filtering logic
- `lib/shopify.ts`: Shopify API integration helpers
- `components/ui/`: Collection of fully styled, reusable UI primitives
- `middleware.ts`: Edge middleware for request handling
- `shopify-theme/snippets/boost-search-widget.liquid`: Theme snippet for integration
- `extensions/theme-app-extension/`: Embedded Shopify app block and assets

---

## 📦 Tech Stack

- **Next.js** & **TypeScript**
- **Tailwind CSS** for styling
- **Shopify Admin API** + Webhooks
- **Typesense** for fast filtering
- **Prisma** for optional database support

---

## 📁 Sample Use Case

You can plug in `product-filter-demo.tsx` into your Shopify storefront’s collection pages to allow users to filter by:

- Tags
- Product type
- Price range
- Availability

Use the admin dashboard pages to track filter performance, product sync statuses, and inventory metrics in real time.

---

## 🔐 Security

This setup includes middleware for API request validation, a rate limiter, and basic auth helpers for route protection.

---

## ✍️ License

MIT — free to use, modify, and integrate.

---

## 🙌 Credits

This boilerplate was structured for devs and brands looking to implement a smarter Shopify storefront experience with clean UI, modular logic, and real-time syncing capabilities.
