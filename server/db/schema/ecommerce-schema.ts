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
    thumbnail: text("thumbnail"),
    status: text("status", {
      enum: ["active", "inactive", "out_of_stock", "hidden"],
    })
      .default("active")
      .notNull(),
    categoryId: text("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    colors: text("colors", { mode: "json" }).$type<string[]>().default([]),
    sizes: text("sizes", { mode: "json" }).$type<string[]>().default([]),
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
  ],
);

// ============================================================================
// PRODUCT VARIANTS
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
    price: real("price").notNull().default(0),
    compareAtPrice: real("compare_at_price"),
    color: text("color"),
    size: text("size"),
    weight: real("weight"),
    weightUnit: text("weight_unit", { enum: ["g", "kg", "lb", "oz"] }).default(
      "g",
    ),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    image: text("image"),
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
    state: text("state"),
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
    billingAddressId: text("billing_address_id").references(
      () => customerAddress.id,
      { onDelete: "set null" },
    ),
    shippingAddressId: text("shipping_address_id").references(
      () => customerAddress.id,
      { onDelete: "set null" },
    ),
    subtotal: real("subtotal").notNull().default(0),
    taxTotal: real("tax_total").notNull().default(0),
    shippingTotal: real("shipping_total").notNull().default(0),
    discountTotal: real("discount_total").notNull().default(0),
    total: real("total").notNull().default(0),
    notes: text("notes"),
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
  billingAddress: one(customerAddress, {
    fields: [order.billingAddressId],
    references: [customerAddress.id],
    relationName: "billingAddress",
  }),
  shippingAddress: one(customerAddress, {
    fields: [order.shippingAddressId],
    references: [customerAddress.id],
    relationName: "shippingAddress",
  }),
  items: many(orderItem),
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
// TYPE EXPORTS
// ============================================================================
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
