-- Create database schema for production deployment

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    shopify_id VARCHAR(255) NOT NULL,
    shop_domain VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    handle VARCHAR(255) NOT NULL,
    description TEXT,
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    tags TEXT[], -- PostgreSQL array type
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    seo_title TEXT,
    seo_description TEXT,
    UNIQUE(shopify_id, shop_domain)
);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(255) PRIMARY KEY,
    shopify_id VARCHAR(255) NOT NULL UNIQUE,
    product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    sku VARCHAR(255),
    barcode VARCHAR(255),
    inventory_quantity INTEGER DEFAULT 0,
    inventory_policy VARCHAR(50) DEFAULT 'deny',
    inventory_management VARCHAR(50) DEFAULT 'not_managed',
    weight DECIMAL(10,3) DEFAULT 0,
    weight_unit VARCHAR(10) DEFAULT 'kg',
    position INTEGER DEFAULT 1,
    option1 VARCHAR(255),
    option2 VARCHAR(255),
    option3 VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(255) PRIMARY KEY,
    shopify_id VARCHAR(255) NOT NULL UNIQUE,
    product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    src TEXT NOT NULL,
    alt TEXT,
    position INTEGER DEFAULT 1,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Product metafields table
CREATE TABLE IF NOT EXISTS product_metafields (
    id VARCHAR(255) PRIMARY KEY,
    shopify_id VARCHAR(255) NOT NULL UNIQUE,
    product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    namespace VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Inventory levels table
CREATE TABLE IF NOT EXISTS inventory_levels (
    id VARCHAR(255) PRIMARY KEY,
    shopify_inventory_item_id VARCHAR(255) NOT NULL,
    shopify_location_id VARCHAR(255) NOT NULL,
    variant_id VARCHAR(255) NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    available INTEGER DEFAULT 0,
    reserved INTEGER DEFAULT 0,
    on_hand INTEGER DEFAULT 0,
    committed INTEGER DEFAULT 0,
    incoming INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(shopify_inventory_item_id, shopify_location_id)
);

-- Sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
    id VARCHAR(255) PRIMARY KEY,
    shop_domain VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    shopify_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_shop_domain ON products(shop_domain);
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_shopify_id ON product_variants(shopify_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

CREATE INDEX IF NOT EXISTS idx_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_position ON product_images(position);

CREATE INDEX IF NOT EXISTS idx_metafields_product_id ON product_metafields(product_id);
CREATE INDEX IF NOT EXISTS idx_metafields_namespace_key ON product_metafields(namespace, key);

CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON inventory_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory_levels(available);

CREATE INDEX IF NOT EXISTS idx_sync_logs_shop_domain ON sync_logs(shop_domain);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);
