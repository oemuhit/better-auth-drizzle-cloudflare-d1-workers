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
    stockQuantity: z.number().default(0),
    sort: z.number().default(0),
});

export const createProductRequestSchema = productSchema.extend({
    variants: z.array(productVariantSchema).optional(),
    images: z.array(z.object({
        url: z.string(),
        alt: z.string().optional().nullable()
    })).optional()
});

export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;

// ============================================================================
// ADDRESS SCHEMAS
// ============================================================================

export const addressSchema = z.object({
    firstName: z.string()
        .trim()
        .min(1, "İsim gereklidir")
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "İsim sadece harflerden oluşmalıdır"),
    lastName: z.string()
        .trim()
        .min(1, "Soyisim gereklidir")
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Soyisim sadece harflerden oluşmalıdır"),
    addressLine1: z.string()
        .trim()
        .min(5, "Adres en az 5 karakter olmalıdır"),
    addressLine2: z.string().trim().default(""),
    city: z.string()
        .trim()
        .min(2, "Şehir en az 2 karakter olmalıdır")
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Şehir sadece harflerden oluşmalıdır"),
    state: z.string()
        .trim()
        .min(2, "İlçe en az 2 karakter olmalıdır")
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "İlçe sadece harflerden oluşmalıdır"),
    postalCode: z.string()
        .trim()
        .min(5, "Posta kodu en az 5 haneli olmalıdır")
        .max(10, "Posta kodu en fazla 10 haneli olmalıdır")
        .regex(/^[0-9]+$/, "Sadece rakam girmelisiniz"),
    countryCode: z.string().trim().min(2).max(2).default("TR"),
    phone: z.string()
        .trim()
        .min(10, "Telefon numarası en az 10 haneli olmalıdır")
        .max(11, "Telefon numarası en fazla 11 haneli olmalıdır")
        .regex(/^[0-9]+$/, "Sadece rakam girmelisiniz"),
    isShipping: z.boolean().default(true),
    isBilling: z.boolean().default(true),
    isDefault: z.boolean().default(false),
});

export type AddressRequest = z.infer<typeof addressSchema>;
