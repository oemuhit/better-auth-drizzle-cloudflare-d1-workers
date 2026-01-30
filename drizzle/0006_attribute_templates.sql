-- Migration: Attribute Templates Table
-- Allows dynamic management of variant attribute templates

CREATE TABLE IF NOT EXISTS `attribute_template` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`type` text DEFAULT 'select' NOT NULL,
	`options` text DEFAULT '[]',
	`description` text,
	`icon` text,
	`sort` integer DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `attribute_template_name_unique` ON `attribute_template` (`name`);
--> statement-breakpoint

-- Insert default attribute templates
INSERT INTO `attribute_template` (`id`, `name`, `label`, `type`, `options`, `description`, `icon`, `sort`) VALUES
('attr-color', 'color', 'Renk', 'color', '[{"value":"black","label":"Siyah","colorCode":"#000000"},{"value":"white","label":"Beyaz","colorCode":"#FFFFFF"},{"value":"red","label":"Kırmızı","colorCode":"#FF0000"},{"value":"blue","label":"Mavi","colorCode":"#0000FF"},{"value":"green","label":"Yeşil","colorCode":"#00FF00"},{"value":"gray","label":"Gri","colorCode":"#808080"},{"value":"navy","label":"Lacivert","colorCode":"#000080"},{"value":"beige","label":"Bej","colorCode":"#F5F5DC"},{"value":"brown","label":"Kahverengi","colorCode":"#8B4513"},{"value":"pink","label":"Pembe","colorCode":"#FFC0CB"},{"value":"purple","label":"Mor","colorCode":"#800080"},{"value":"orange","label":"Turuncu","colorCode":"#FFA500"},{"value":"yellow","label":"Sarı","colorCode":"#FFFF00"}]', 'Ürün renk seçenekleri', 'palette', 1),

('attr-size', 'size', 'Beden', 'size', '[{"value":"xxs","label":"XXS"},{"value":"xs","label":"XS"},{"value":"s","label":"S"},{"value":"m","label":"M"},{"value":"l","label":"L"},{"value":"xl","label":"XL"},{"value":"xxl","label":"XXL"},{"value":"3xl","label":"3XL"}]', 'Giyim beden seçenekleri', 'ruler', 2),

('attr-shoe-size', 'shoe_size', 'Ayakkabı Numarası', 'size', '[{"value":"35","label":"35"},{"value":"36","label":"36"},{"value":"37","label":"37"},{"value":"38","label":"38"},{"value":"39","label":"39"},{"value":"40","label":"40"},{"value":"41","label":"41"},{"value":"42","label":"42"},{"value":"43","label":"43"},{"value":"44","label":"44"},{"value":"45","label":"45"},{"value":"46","label":"46"}]', 'Ayakkabı numara seçenekleri', 'footprints', 3),

('attr-storage', 'storage', 'Depolama', 'select', '[{"value":"32gb","label":"32 GB"},{"value":"64gb","label":"64 GB"},{"value":"128gb","label":"128 GB"},{"value":"256gb","label":"256 GB"},{"value":"512gb","label":"512 GB"},{"value":"1tb","label":"1 TB"},{"value":"2tb","label":"2 TB"}]', 'Depolama kapasitesi seçenekleri', 'hard-drive', 4),

('attr-memory', 'memory', 'RAM', 'select', '[{"value":"4gb","label":"4 GB"},{"value":"8gb","label":"8 GB"},{"value":"12gb","label":"12 GB"},{"value":"16gb","label":"16 GB"},{"value":"32gb","label":"32 GB"},{"value":"64gb","label":"64 GB"},{"value":"128gb","label":"128 GB"}]', 'Bellek (RAM) seçenekleri', 'cpu', 5),

('attr-material', 'material', 'Malzeme', 'select', '[{"value":"cotton","label":"Pamuk"},{"value":"polyester","label":"Polyester"},{"value":"linen","label":"Keten"},{"value":"wool","label":"Yün"},{"value":"silk","label":"İpek"},{"value":"leather","label":"Deri"},{"value":"suede","label":"Süet"},{"value":"denim","label":"Denim"},{"value":"velvet","label":"Kadife"},{"value":"cashmere","label":"Kaşmir"}]', 'Malzeme/kumaş seçenekleri', 'shirt', 6),

('attr-pattern', 'pattern', 'Desen', 'select', '[{"value":"solid","label":"Düz"},{"value":"striped","label":"Çizgili"},{"value":"checked","label":"Kareli"},{"value":"floral","label":"Çiçekli"},{"value":"geometric","label":"Geometrik"},{"value":"abstract","label":"Soyut"},{"value":"animal","label":"Hayvan Deseni"},{"value":"polka_dot","label":"Puantiyeli"}]', 'Desen seçenekleri', 'shapes', 7),

('attr-width', 'width', 'Genişlik', 'select', '[{"value":"narrow","label":"Dar"},{"value":"regular","label":"Normal"},{"value":"wide","label":"Geniş"},{"value":"extra_wide","label":"Ekstra Geniş"}]', 'Genişlik seçenekleri', 'move-horizontal', 8),

('attr-length', 'length', 'Uzunluk', 'select', '[{"value":"short","label":"Kısa"},{"value":"regular","label":"Normal"},{"value":"long","label":"Uzun"},{"value":"extra_long","label":"Ekstra Uzun"}]', 'Uzunluk seçenekleri', 'move-vertical', 9),

('attr-style', 'style', 'Stil', 'select', '[{"value":"casual","label":"Günlük"},{"value":"formal","label":"Resmi"},{"value":"sport","label":"Spor"},{"value":"classic","label":"Klasik"},{"value":"modern","label":"Modern"},{"value":"vintage","label":"Vintage"},{"value":"bohemian","label":"Bohem"}]', 'Stil seçenekleri', 'sparkles', 10);
