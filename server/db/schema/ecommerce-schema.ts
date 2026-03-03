import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

// ============================================================================
// Variant Attribute Types - Defines what attributes exist in the system
// Example: "color", "size", "material", "storage", "memory"
// ============================================================================
export interface VariantAttributeOption {
  value: string;
  label: string;
  colorCode?: string; // For color attributes, e.g., "#FF0000"
  image?: string; // Optional image URL for this option
}

export interface VariantAttributeDefinition {
  name: string; // e.g., "color", "size", "material"
  label: string; // e.g., "Renk", "Beden", "Malzeme"
  type: "color" | "size" | "select" | "text";
  options: VariantAttributeOption[];
}

// ============================================================================
// ATTRIBUTE TEMPLATES - Reusable attribute definitions
// ============================================================================
export const attributeTemplate = sqliteTable("attribute_template", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // e.g., "color", "size", "storage"
  label: text("label").notNull(), // e.g., "Renk", "Beden", "Depolama"
  type: text("type", { enum: ["color", "size", "select", "text"] })
    .notNull()
    .default("select"),
  // Options stored as JSON array
  options: text("options", { mode: "json" })
    .$type<VariantAttributeOption[]>()
    .default([]),
  description: text("description"),
  icon: text("icon"), // Lucide icon name
  sort: integer("sort").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================================================
// TAX RATES
// ============================================================================
export const taxRate = sqliteTable("tax_rate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  code: text("code").notNull().unique(),
  rate: real("rate").notNull().default(0), // Percentage, e.g., 18 for 18%
  isDefault: integer("is_default", { mode: "boolean" })
    .default(false)
    .notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================================================
// CATEGORIES
// ============================================================================
export const category = sqliteTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    image: text("image"), // Category image URL
    parentCategoryId: text("parent_category_id").references(
      (): any => category.id,
      { onDelete: "set null" },
    ),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    sort: integer("sort").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("category_slug_idx").on(table.slug),
    index("category_parent_idx").on(table.parentCategoryId),
  ],
);

// ============================================================================
// PRODUCTS
// ============================================================================
export const product = sqliteTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    shortDescription: text("short_description"),
    thumbnail: text("thumbnail"),
    status: text("status", {
      enum: [
        "active",
        "inactive",
        "out_of_stock",
        "backordered",
        "hidden",
        "draft",
      ],
    })
      .default("draft")
      .notNull(),
    categoryId: text("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    // Tax rate reference
    taxRateId: text("tax_rate_id").references(() => taxRate.id, {
      onDelete: "set null",
    }),
    // Flexible attribute definitions for this product
    // Stores available options for each attribute type
    // Example: { "color": { name: "color", label: "Renk", type: "color", options: [...] }, "size": {...} }
    variantAttributes: text("variant_attributes", { mode: "json" })
      .$type<Record<string, VariantAttributeDefinition>>()
      .default({}),
    // SEO fields
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    // Pricing
    basePrice: real("base_price").default(0),
    compareAtPrice: real("compare_at_price"),
    // Flags
    isFeatured: integer("is_featured", { mode: "boolean" })
      .default(false)
      .notNull(),
    isNew: integer("is_new", { mode: "boolean" }).default(false).notNull(),
    // Inventory
    trackInventory: integer("track_inventory", { mode: "boolean" })
      .default(true)
      .notNull(),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    sort: integer("sort").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("product_slug_idx").on(table.slug),
    index("product_category_idx").on(table.categoryId),
    index("product_status_idx").on(table.status),
    index("product_featured_idx").on(table.isFeatured),
  ],
);

// ============================================================================
// PRODUCT VARIANTS
// Flexible variant system - supports any combination of attributes
// ============================================================================
export const productVariant = sqliteTable(
  "product_variant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    sku: text("sku").unique(),
    barcode: text("barcode"),
    price: real("price").notNull().default(0),
    compareAtPrice: real("compare_at_price"),
    costPrice: real("cost_price"), // Cost for profit calculation
    // Flexible attributes - stores the actual attribute values for this variant
    // Example: { "color": "Red", "size": "XL", "material": "Cotton", "storage": "256GB" }
    attributes: text("attributes", { mode: "json" })
      .$type<Record<string, string>>()
      .default({}),
    // Weight & Dimensions
    weight: real("weight"),
    weightUnit: text("weight_unit", { enum: ["g", "kg", "lb", "oz"] }).default(
      "g",
    ),
    length: real("length"),
    width: real("width"),
    height: real("height"),
    dimensionUnit: text("dimension_unit", {
      enum: ["cm", "m", "in", "ft"],
    }).default("cm"),
    // Inventory
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5),
    allowBackorder: integer("allow_backorder", { mode: "boolean" })
      .default(false)
      .notNull(),
    // Media
    image: text("image"),
    images: text("images", { mode: "json" }).$type<string[]>().default([]),
    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    sort: integer("sort").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("variant_product_idx").on(table.productId),
    index("variant_sku_idx").on(table.sku),
    index("variant_barcode_idx").on(table.barcode),
  ],
);

// ============================================================================
// PRODUCT IMAGES
// ============================================================================
export const productImage = sqliteTable(
  "product_image",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    sort: integer("sort").default(0),
  },
  (table) => [index("product_image_product_idx").on(table.productId)],
);

// ============================================================================
// CUSTOMER ADDRESSES
// ============================================================================
export const customerAddress = sqliteTable(
  "customer_address",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    cityCode: text("city_code"),
    state: text("state"),
    district: text("district"),
    postalCode: text("postal_code").notNull(),
    countryCode: text("country_code").notNull().default("TR"),
    phone: text("phone"),
    isShipping: integer("is_shipping", { mode: "boolean" })
      .default(true)
      .notNull(),
    isBilling: integer("is_billing", { mode: "boolean" })
      .default(true)
      .notNull(),
    isDefault: integer("is_default", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("address_user_idx").on(table.userId)],
);

// ============================================================================
// ORDERS
// ============================================================================
export const order = sqliteTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "processing", "completed", "cancelled", "archived"],
    })
      .default("pending")
      .notNull(),
    fulfillmentStatus: text("fulfillment_status", {
      enum: ["open", "in_progress", "fulfilled", "on_hold"],
    })
      .default("open")
      .notNull(),
    paymentStatus: text("payment_status", {
      enum: ["not_paid", "awaiting", "paid", "refunded"],
    })
      .default("not_paid")
      .notNull(),
    shippingAddressSnapshot: text("shipping_address_snapshot", {
      mode: "json",
    }).$type<CustomerAddress>(),
    billingAddressSnapshot: text("billing_address_snapshot", {
      mode: "json",
    }).$type<CustomerAddress>(),
    subtotal: real("subtotal").notNull().default(0),
    taxTotal: real("tax_total").notNull().default(0),
    shippingTotal: real("shipping_total").notNull().default(0),
    discountTotal: real("discount_total").notNull().default(0),
    total: real("total").notNull().default(0),
    notes: text("notes"),
    // Geliver cargo tracking
    geliverShipmentId: text("geliver_shipment_id"),
    trackingNumber: text("tracking_number"),
    barcode: text("barcode"),
    trackingUrl: text("tracking_url"),
    labelUrl: text("label_url"),
    // Geliver payment info
    transactionId: text("transaction_id"),
    amountCharged: text("amount_charged"),
    currency: text("currency"),
    // Geliver return shipment tracking
    returnShipmentId: text("return_shipment_id"),
    returnBarcode: text("return_barcode"),
    returnLabelUrl: text("return_label_url"),
    couponCode: text("coupon_code"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    cancelledAt: integer("cancelled_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("order_user_idx").on(table.userId),
    index("order_number_idx").on(table.orderNumber),
    index("order_status_idx").on(table.status),
  ],
);

// ============================================================================
// ORDER ITEMS
// ============================================================================
export const orderItem = sqliteTable(
  "order_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    productVariantId: text("product_variant_id").references(
      () => productVariant.id,
      { onDelete: "set null" },
    ),
    productTitle: text("product_title").notNull(),
    variantInfo: text("variant_info"),
    quantity: integer("quantity").notNull().default(1),
    price: real("price").notNull(),
    subtotal: real("subtotal").notNull(),
    total: real("total").notNull(),
    sort: integer("sort").default(0),
  },
  (table) => [
    index("order_item_order_idx").on(table.orderId),
    index("order_item_product_idx").on(table.productId),
  ],
);

// ============================================================================
// CART (Server-side cart for logged-in users)
// ============================================================================
export const cart = sqliteTable(
  "cart",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("cart_user_idx").on(table.userId)],
);

export const cartItem = sqliteTable(
  "cart_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cartId: text("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    productVariantId: text("product_variant_id").references(
      () => productVariant.id,
      { onDelete: "cascade" },
    ),
    quantity: integer("quantity").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("cart_item_cart_idx").on(table.cartId),
    index("cart_item_product_idx").on(table.productId),
  ],
);

// ============================================================================
// RELATIONS
// ============================================================================

// Tax Rate relations
export const taxRateRelations = relations(taxRate, ({ many }) => ({
  products: many(product),
}));

// Category relations
export const categoryRelations = relations(category, ({ one, many }) => ({
  parentCategory: one(category, {
    fields: [category.parentCategoryId],
    references: [category.id],
    relationName: "categoryParent",
  }),
  subCategories: many(category, { relationName: "categoryParent" }),
  products: many(product),
}));

// Product relations
export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, {
    fields: [product.categoryId],
    references: [category.id],
  }),
  taxRate: one(taxRate, {
    fields: [product.taxRateId],
    references: [taxRate.id],
  }),
  variants: many(productVariant),
  images: many(productImage),
  orderItems: many(orderItem),
  cartItems: many(cartItem),
}));

// Product Variant relations
export const productVariantRelations = relations(
  productVariant,
  ({ one, many }) => ({
    product: one(product, {
      fields: [productVariant.productId],
      references: [product.id],
    }),
    orderItems: many(orderItem),
    cartItems: many(cartItem),
  }),
);

// Product Image relations
export const productImageRelations = relations(productImage, ({ one }) => ({
  product: one(product, {
    fields: [productImage.productId],
    references: [product.id],
  }),
}));

// Customer Address relations
export const customerAddressRelations = relations(
  customerAddress,
  ({ one, many }) => ({
    user: one(user, {
      fields: [customerAddress.userId],
      references: [user.id],
    }),
    billingOrders: many(order, { relationName: "billingAddress" }),
    shippingOrders: many(order, { relationName: "shippingAddress" }),
  }),
);

// Order relations
export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  items: many(orderItem),
  couponUsages: many(couponUsage),
}));

// Order Item relations
export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
  productVariant: one(productVariant, {
    fields: [orderItem.productVariantId],
    references: [productVariant.id],
  }),
}));

// Cart relations
export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, {
    fields: [cart.userId],
    references: [user.id],
  }),
  items: many(cartItem),
}));

// Cart Item relations
export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, {
    fields: [cartItem.cartId],
    references: [cart.id],
  }),
  product: one(product, {
    fields: [cartItem.productId],
    references: [product.id],
  }),
  productVariant: one(productVariant, {
    fields: [cartItem.productVariantId],
    references: [productVariant.id],
  }),
}));

// ============================================================================
// WISHLIST
// ============================================================================
export const wishlist = sqliteTable(
  "wishlist",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("wishlist_user_idx").on(table.userId),
    index("wishlist_product_idx").on(table.productId),
  ],
);

// Wishlist relations
export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(user, {
    fields: [wishlist.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [wishlist.productId],
    references: [product.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type TaxRate = typeof taxRate.$inferSelect;
export type NewTaxRate = typeof taxRate.$inferInsert;
export type Wishlist = typeof wishlist.$inferSelect;
export type NewWishlist = typeof wishlist.$inferInsert;
export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;
export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
export type ProductVariant = typeof productVariant.$inferSelect;
export type NewProductVariant = typeof productVariant.$inferInsert;
export type ProductImage = typeof productImage.$inferSelect;
export type NewProductImage = typeof productImage.$inferInsert;
export type CustomerAddress = typeof customerAddress.$inferSelect;
export type NewCustomerAddress = typeof customerAddress.$inferInsert;
export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;
export type OrderItem = typeof orderItem.$inferSelect;
export type NewOrderItem = typeof orderItem.$inferInsert;
export type Cart = typeof cart.$inferSelect;
export type NewCart = typeof cart.$inferInsert;
export type CartItem = typeof cartItem.$inferSelect;
export type NewCartItem = typeof cartItem.$inferInsert;
export type AttributeTemplate = typeof attributeTemplate.$inferSelect;
export type NewAttributeTemplate = typeof attributeTemplate.$inferInsert;
export type Coupon = typeof coupon.$inferSelect;
export type NewCoupon = typeof coupon.$inferInsert;
export type CouponUsage = typeof couponUsage.$inferSelect;
export type NewCouponUsage = typeof couponUsage.$inferInsert;

// ============================================================================
// STOCK RESERVATIONS - Prevents overselling during checkout
// ============================================================================
export const stockReservation = sqliteTable(
  "stock_reservation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id").notNull(),
    productVariantId: text("product_variant_id")
      .references(() => productVariant.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .references(() => product.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    expiresAt: integer("expires_at").notNull(),
    confirmed: integer("confirmed", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_stock_reservation_expires").on(table.expiresAt),
    index("idx_stock_reservation_order").on(table.orderId),
    index("idx_stock_reservation_variant").on(table.productVariantId, table.confirmed),
    index("idx_stock_reservation_product").on(table.productId, table.confirmed),
  ]
);

export const stockReservationRelations = relations(stockReservation, ({ one }) => ({
  productVariant: one(productVariant, {
    fields: [stockReservation.productVariantId],
    references: [productVariant.id],
  }),
  product: one(product, {
    fields: [stockReservation.productId],
    references: [product.id],
  }),
}));

export type StockReservation = typeof stockReservation.$inferSelect;
export type NewStockReservation = typeof stockReservation.$inferInsert;

// ============================================================================
// COUPONS
// ============================================================================
export const coupon = sqliteTable(
  "coupon",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    discountType: text("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
    discountValue: real("discount_value").notNull(),
    minPurchaseAmount: real("min_purchase_amount").default(0),
    startDate: integer("start_date", { mode: "timestamp_ms" }),
    endDate: integer("end_date", { mode: "timestamp_ms" }),
    isNewUserOnly: integer("is_new_user_only", { mode: "boolean" }).default(false).notNull(),
    isFirstPurchaseOnly: integer("is_first_purchase_only", { mode: "boolean" }).default(false).notNull(),
    usageLimitPerUser: integer("usage_limit_per_user").default(1),
    usageLimitTotal: integer("usage_limit_total"),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_coupon_code").on(table.code),
    index("idx_coupon_active").on(table.isActive),
  ]
);

export const couponUsage = sqliteTable(
  "coupon_usage",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupon.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    discountAmount: real("discount_amount").notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("idx_coupon_usage_coupon").on(table.couponId),
    index("idx_coupon_usage_user").on(table.userId),
    index("idx_coupon_usage_order").on(table.orderId),
  ]
);

export const couponRelations = relations(coupon, ({ many }) => ({
  usages: many(couponUsage),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupon, {
    fields: [couponUsage.couponId],
    references: [coupon.id],
  }),
  user: one(user, {
    fields: [couponUsage.userId],
    references: [user.id],
  }),
  order: one(order, {
    fields: [couponUsage.orderId],
    references: [order.id],
  }),
}));

// ============================================================================
// TICKETS - Customer support system
// ============================================================================
export const ticket = sqliteTable(
  "ticket",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => order.id, {
      onDelete: "set null",
    }),
    subject: text("subject").notNull(),
    category: text("category", {
      enum: ["order", "payment", "account", "technical", "other"],
    })
      .notNull()
      .default("other"),
    status: text("status", {
      enum: ["open", "closed", "pending", "in_progress"],
    })
      .notNull()
      .default("open"),
    priority: text("priority", {
      enum: ["low", "medium", "high"],
    })
      .notNull()
      .default("medium"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_ticket_user").on(table.userId),
    index("idx_ticket_order").on(table.orderId),
    index("idx_ticket_status").on(table.status),
  ],
);

export const ticketMessage = sqliteTable(
  "ticket_message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    isAdmin: integer("is_admin", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("idx_ticket_message_ticket").on(table.ticketId)],
);

// ============================================================================
// RELATIONS - Tickets
// ============================================================================
export const ticketRelations = relations(ticket, ({ one, many }) => ({
  user: one(user, {
    fields: [ticket.userId],
    references: [user.id],
  }),
  order: one(order, {
    fields: [ticket.orderId],
    references: [order.id],
  }),
  messages: many(ticketMessage),
}));

export const ticketMessageRelations = relations(ticketMessage, ({ one }) => ({
  ticket: one(ticket, {
    fields: [ticketMessage.ticketId],
    references: [ticket.id],
  }),
  sender: one(user, {
    fields: [ticketMessage.senderId],
    references: [user.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS - Tickets
// ============================================================================
export type Ticket = typeof ticket.$inferSelect;
export type NewTicket = typeof ticket.$inferInsert;
export type TicketMessage = typeof ticketMessage.$inferSelect;
export type NewTicketMessage = typeof ticketMessage.$inferInsert;
