import { z } from "zod";

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const variantAttributeOptionSchema = z.object({
    value: z.string(),
    label: z.string(),
    colorCode: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
});

export const variantAttributeDefinitionSchema = z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(["color", "size", "select", "text"]),
    options: z.array(variantAttributeOptionSchema),
});

export const productVariantSchema = z.object({
    id: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    price: z.number().default(0),
    compareAtPrice: z.number().optional().nullable(),
    costPrice: z.number().optional().nullable(),
    attributes: z.record(z.string()).default({}),
    weight: z.number().optional().nullable(),
    weightUnit: z.enum(["g", "kg", "lb", "oz"]).default("g"),
    length: z.number().optional().nullable(),
    width: z.number().optional().nullable(),
    height: z.number().optional().nullable(),
    dimensionUnit: z.enum(["cm", "m", "in", "ft"]).default("cm"),
    stockQuantity: z.number().default(0),
    lowStockThreshold: z.number().default(5),
    allowBackorder: z.boolean().default(false),
    image: z.string().optional().nullable(),
    images: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    sort: z.number().default(0),
});

export const productSchema = z.object({
    title: z.string().min(2, "Başlık en az 2 karakter olmalıdır"),
    slug: z.string().min(2, "Slug en az 2 karakter olmalıdır"),
    description: z.string().optional().nullable(),
    shortDescription: z.string().optional().nullable(),
    thumbnail: z.string().optional().nullable(),
    status: z.enum(["active", "inactive", "out_of_stock", "backordered", "hidden", "draft"]).default("draft"),
    categoryId: z.string().optional().nullable(),
    taxRateId: z.string().optional().nullable(),
    variantAttributes: z.record(variantAttributeDefinitionSchema).default({}),
    metaTitle: z.string().optional().nullable(),
    metaDescription: z.string().optional().nullable(),
    basePrice: z.number().default(0),
    compareAtPrice: z.number().optional().nullable(),
    isFeatured: z.boolean().default(false),
    isNew: z.boolean().default(false),
    trackInventory: z.boolean().default(true),
    sort: z.number().default(0),
});

export const createProductRequestSchema = productSchema.extend({
    variants: z.array(productVariantSchema).optional(),
    images: z.array(z.object({
        url: z.string().url("Geçerli bir URL giriniz"),
        alt: z.string().optional().nullable()
    })).optional()
});

export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;
