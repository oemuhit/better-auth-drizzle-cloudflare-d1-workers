-- Clear existing data
DELETE FROM product_image;
DELETE FROM product_variant;
DELETE FROM product;
DELETE FROM category;

-- Main Categories
INSERT INTO category (id, title, slug, is_active, sort, created_at, updated_at) VALUES
('cat-1', 'Clothing', 'clothing', 1, 1, 1706650000000, 1706650000000),
('cat-2', 'Accessories', 'accessories', 1, 2, 1706650000000, 1706650000000),
('cat-3', 'Shoes', 'shoes', 1, 3, 1706650000000, 1706650000000),
('cat-4', 'Electronics', 'electronics', 1, 4, 1706650000000, 1706650000000);

-- Subcategories
INSERT INTO category (id, title, slug, parent_category_id, is_active, sort, created_at, updated_at) VALUES
('cat-5', 'T-Shirts', 't-shirts', 'cat-1', 1, 1, 1706650000000, 1706650000000),
('cat-6', 'Hoodies', 'hoodies', 'cat-1', 1, 2, 1706650000000, 1706650000000),
('cat-7', 'Pants', 'pants', 'cat-1', 1, 3, 1706650000000, 1706650000000),
('cat-8', 'Bags', 'bags', 'cat-2', 1, 1, 1706650000000, 1706650000000),
('cat-9', 'Watches', 'watches', 'cat-2', 1, 2, 1706650000000, 1706650000000),
('cat-10', 'Sneakers', 'sneakers', 'cat-3', 1, 1, 1706650000000, 1706650000000),
('cat-11', 'Boots', 'boots', 'cat-3', 1, 2, 1706650000000, 1706650000000),
('cat-12', 'Headphones', 'headphones', 'cat-4', 1, 1, 1706650000000, 1706650000000),
('cat-13', 'Speakers', 'speakers', 'cat-4', 1, 2, 1706650000000, 1706650000000);

-- Products
INSERT INTO product (id, title, slug, description, thumbnail, status, category_id, colors, sizes, sort, created_at, updated_at) VALUES
('prod-1', 'Classic Cotton T-Shirt', 'classic-cotton-t-shirt', 'Premium quality 100% cotton t-shirt. Soft, breathable, and perfect for everyday wear.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 'active', 'cat-5', '["Black","White","Navy","Gray"]', '["S","M","L","XL"]', 0, 1706650000000, 1706650000000),
('prod-2', 'Graphic Print Tee', 'graphic-print-tee', 'Express yourself with our artistic graphic tee. Made from soft cotton blend.', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500', 'active', 'cat-5', '["White","Black"]', '["S","M","L","XL","XXL"]', 0, 1706650000000, 1706650000000),
('prod-3', 'Premium Zip Hoodie', 'premium-zip-hoodie', 'Stay warm in style with our premium zip-up hoodie. Soft fleece interior.', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', 'active', 'cat-6', '["Black","Gray","Navy"]', '["S","M","L","XL","XXL"]', 0, 1706650000000, 1706650000000),
('prod-4', 'Pullover Comfort Hoodie', 'pullover-comfort-hoodie', 'Ultimate comfort pullover hoodie with adjustable drawstring hood.', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500', 'active', 'cat-6', '["Black","White","Red","Green"]', '["S","M","L","XL"]', 0, 1706650000000, 1706650000000),
('prod-5', 'Slim Fit Chinos', 'slim-fit-chinos', 'Modern slim fit chinos crafted from stretch cotton.', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500', 'active', 'cat-7', '["Black","Navy","Gray"]', '["S","M","L","XL"]', 0, 1706650000000, 1706650000000),
('prod-6', 'Classic Denim Jeans', 'classic-denim-jeans', 'Timeless straight-leg denim jeans with slight stretch.', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 'active', 'cat-7', '["Blue","Black"]', '["S","M","L","XL","XXL"]', 0, 1706650000000, 1706650000000),
('prod-7', 'Leather Messenger Bag', 'leather-messenger-bag', 'Handcrafted genuine leather messenger bag with multiple compartments.', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 'active', 'cat-8', '["Black","Brown"]', '["One Size"]', 0, 1706650000000, 1706650000000),
('prod-8', 'Canvas Backpack', 'canvas-backpack', 'Durable canvas backpack with leather accents.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'active', 'cat-8', '["Gray","Navy","Green"]', '["One Size"]', 0, 1706650000000, 1706650000000),
('prod-9', 'Minimalist Steel Watch', 'minimalist-steel-watch', 'Elegant minimalist watch with stainless steel case.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'active', 'cat-9', '["Silver","Gold","Rose Gold"]', '["One Size"]', 0, 1706650000000, 1706650000000),
('prod-10', 'Sport Digital Watch', 'sport-digital-watch', 'Digital sports watch with heart rate monitor and GPS.', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500', 'active', 'cat-9', '["Black","White"]', '["One Size"]', 0, 1706650000000, 1706650000000),
('prod-11', 'Urban Runner Sneakers', 'urban-runner-sneakers', 'Lightweight running sneakers with responsive cushioning.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'active', 'cat-10', '["Black","White","Red"]', '["39","40","41","42","43","44"]', 0, 1706650000000, 1706650000000),
('prod-12', 'Classic Canvas Sneakers', 'classic-canvas-sneakers', 'Timeless canvas sneakers with vulcanized rubber sole.', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500', 'active', 'cat-10', '["White","Black","Navy"]', '["38","39","40","41","42","43","44","45"]', 0, 1706650000000, 1706650000000),
('prod-13', 'Leather Chelsea Boots', 'leather-chelsea-boots', 'Classic Chelsea boots in premium leather.', 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500', 'active', 'cat-11', '["Black","Brown"]', '["39","40","41","42","43","44","45"]', 0, 1706650000000, 1706650000000),
('prod-14', 'Wireless Over-Ear Headphones', 'wireless-over-ear-headphones', 'Premium wireless headphones with active noise cancellation.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'active', 'cat-12', '["Black","White","Navy"]', '["One Size"]', 0, 1706650000000, 1706650000000),
('prod-15', 'True Wireless Earbuds', 'true-wireless-earbuds', 'Compact true wireless earbuds with crystal clear audio.', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', 'active', 'cat-12', '["Black","White"]', '["One Size"]', 0, 1706650000000, 1706650000000),
('prod-16', 'Portable Bluetooth Speaker', 'portable-bluetooth-speaker', 'Powerful portable speaker with 360 degree sound.', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'active', 'cat-13', '["Black","Blue","Red"]', '["One Size"]', 0, 1706650000000, 1706650000000),
('prod-17', 'Smart Home Speaker', 'smart-home-speaker', 'Voice-controlled smart speaker with premium audio.', 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500', 'active', 'cat-13', '["Black","White","Gray"]', '["One Size"]', 0, 1706650000000, 1706650000000);

-- Product Variants (sample for each product)
-- Product 1: Classic Cotton T-Shirt
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-1-1', 'prod-1', 'classic-cotton-t-shirt-black-s', 149.99, NULL, 'Black', 'S', 25, 1706650000000, 1706650000000),
('pv-1-2', 'prod-1', 'classic-cotton-t-shirt-black-m', 149.99, NULL, 'Black', 'M', 30, 1706650000000, 1706650000000),
('pv-1-3', 'prod-1', 'classic-cotton-t-shirt-black-l', 149.99, NULL, 'Black', 'L', 20, 1706650000000, 1706650000000),
('pv-1-4', 'prod-1', 'classic-cotton-t-shirt-white-s', 149.99, NULL, 'White', 'S', 15, 1706650000000, 1706650000000),
('pv-1-5', 'prod-1', 'classic-cotton-t-shirt-white-m', 149.99, NULL, 'White', 'M', 25, 1706650000000, 1706650000000),
('pv-1-6', 'prod-1', 'classic-cotton-t-shirt-navy-l', 149.99, NULL, 'Navy', 'L', 18, 1706650000000, 1706650000000);

-- Product 2: Graphic Print Tee
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-2-1', 'prod-2', 'graphic-print-tee-white-m', 179.99, 199.99, 'White', 'M', 20, 1706650000000, 1706650000000),
('pv-2-2', 'prod-2', 'graphic-print-tee-white-l', 179.99, 199.99, 'White', 'L', 15, 1706650000000, 1706650000000),
('pv-2-3', 'prod-2', 'graphic-print-tee-black-m', 179.99, NULL, 'Black', 'M', 22, 1706650000000, 1706650000000);

-- Product 3: Premium Zip Hoodie
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-3-1', 'prod-3', 'premium-zip-hoodie-black-m', 349.99, NULL, 'Black', 'M', 12, 1706650000000, 1706650000000),
('pv-3-2', 'prod-3', 'premium-zip-hoodie-black-l', 349.99, NULL, 'Black', 'L', 18, 1706650000000, 1706650000000),
('pv-3-3', 'prod-3', 'premium-zip-hoodie-gray-m', 349.99, 399.99, 'Gray', 'M', 10, 1706650000000, 1706650000000),
('pv-3-4', 'prod-3', 'premium-zip-hoodie-navy-xl', 349.99, NULL, 'Navy', 'XL', 8, 1706650000000, 1706650000000);

-- Product 4: Pullover Comfort Hoodie
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-4-1', 'prod-4', 'pullover-comfort-hoodie-black-m', 299.99, NULL, 'Black', 'M', 15, 1706650000000, 1706650000000),
('pv-4-2', 'prod-4', 'pullover-comfort-hoodie-red-l', 299.99, 349.99, 'Red', 'L', 8, 1706650000000, 1706650000000),
('pv-4-3', 'prod-4', 'pullover-comfort-hoodie-green-m', 299.99, NULL, 'Green', 'M', 12, 1706650000000, 1706650000000);

-- Product 5: Slim Fit Chinos
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-5-1', 'prod-5', 'slim-fit-chinos-black-m', 279.99, NULL, 'Black', 'M', 20, 1706650000000, 1706650000000),
('pv-5-2', 'prod-5', 'slim-fit-chinos-navy-l', 279.99, NULL, 'Navy', 'L', 15, 1706650000000, 1706650000000),
('pv-5-3', 'prod-5', 'slim-fit-chinos-gray-m', 279.99, 319.99, 'Gray', 'M', 18, 1706650000000, 1706650000000);

-- Product 6: Classic Denim Jeans
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-6-1', 'prod-6', 'classic-denim-jeans-blue-m', 329.99, NULL, 'Blue', 'M', 25, 1706650000000, 1706650000000),
('pv-6-2', 'prod-6', 'classic-denim-jeans-blue-l', 329.99, NULL, 'Blue', 'L', 20, 1706650000000, 1706650000000),
('pv-6-3', 'prod-6', 'classic-denim-jeans-black-m', 329.99, 379.99, 'Black', 'M', 18, 1706650000000, 1706650000000);

-- Product 7: Leather Messenger Bag
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-7-1', 'prod-7', 'leather-messenger-bag-black', 899.99, NULL, 'Black', 'One Size', 10, 1706650000000, 1706650000000),
('pv-7-2', 'prod-7', 'leather-messenger-bag-brown', 899.99, 999.99, 'Brown', 'One Size', 8, 1706650000000, 1706650000000);

-- Product 8: Canvas Backpack
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-8-1', 'prod-8', 'canvas-backpack-gray', 449.99, NULL, 'Gray', 'One Size', 15, 1706650000000, 1706650000000),
('pv-8-2', 'prod-8', 'canvas-backpack-navy', 449.99, NULL, 'Navy', 'One Size', 12, 1706650000000, 1706650000000),
('pv-8-3', 'prod-8', 'canvas-backpack-green', 449.99, 499.99, 'Green', 'One Size', 10, 1706650000000, 1706650000000);

-- Product 9: Minimalist Steel Watch
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-9-1', 'prod-9', 'minimalist-steel-watch-silver', 1299.99, NULL, 'Silver', 'One Size', 8, 1706650000000, 1706650000000),
('pv-9-2', 'prod-9', 'minimalist-steel-watch-gold', 1399.99, 1499.99, 'Gold', 'One Size', 5, 1706650000000, 1706650000000),
('pv-9-3', 'prod-9', 'minimalist-steel-watch-rose-gold', 1349.99, NULL, 'Rose Gold', 'One Size', 6, 1706650000000, 1706650000000);

-- Product 10: Sport Digital Watch
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-10-1', 'prod-10', 'sport-digital-watch-black', 799.99, NULL, 'Black', 'One Size', 15, 1706650000000, 1706650000000),
('pv-10-2', 'prod-10', 'sport-digital-watch-white', 799.99, 899.99, 'White', 'One Size', 10, 1706650000000, 1706650000000);

-- Product 11: Urban Runner Sneakers
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-11-1', 'prod-11', 'urban-runner-sneakers-black-42', 599.99, NULL, 'Black', '42', 12, 1706650000000, 1706650000000),
('pv-11-2', 'prod-11', 'urban-runner-sneakers-white-43', 599.99, NULL, 'White', '43', 10, 1706650000000, 1706650000000),
('pv-11-3', 'prod-11', 'urban-runner-sneakers-red-41', 599.99, 699.99, 'Red', '41', 8, 1706650000000, 1706650000000);

-- Product 12: Classic Canvas Sneakers
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-12-1', 'prod-12', 'classic-canvas-sneakers-white-42', 349.99, NULL, 'White', '42', 20, 1706650000000, 1706650000000),
('pv-12-2', 'prod-12', 'classic-canvas-sneakers-black-43', 349.99, NULL, 'Black', '43', 18, 1706650000000, 1706650000000),
('pv-12-3', 'prod-12', 'classic-canvas-sneakers-navy-41', 349.99, 399.99, 'Navy', '41', 15, 1706650000000, 1706650000000);

-- Product 13: Leather Chelsea Boots
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-13-1', 'prod-13', 'leather-chelsea-boots-black-42', 899.99, NULL, 'Black', '42', 10, 1706650000000, 1706650000000),
('pv-13-2', 'prod-13', 'leather-chelsea-boots-brown-43', 899.99, 999.99, 'Brown', '43', 8, 1706650000000, 1706650000000);

-- Product 14: Wireless Over-Ear Headphones
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-14-1', 'prod-14', 'wireless-over-ear-headphones-black', 1499.99, NULL, 'Black', 'One Size', 20, 1706650000000, 1706650000000),
('pv-14-2', 'prod-14', 'wireless-over-ear-headphones-white', 1499.99, NULL, 'White', 'One Size', 15, 1706650000000, 1706650000000),
('pv-14-3', 'prod-14', 'wireless-over-ear-headphones-navy', 1499.99, 1699.99, 'Navy', 'One Size', 10, 1706650000000, 1706650000000);

-- Product 15: True Wireless Earbuds
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-15-1', 'prod-15', 'true-wireless-earbuds-black', 699.99, NULL, 'Black', 'One Size', 30, 1706650000000, 1706650000000),
('pv-15-2', 'prod-15', 'true-wireless-earbuds-white', 699.99, 799.99, 'White', 'One Size', 25, 1706650000000, 1706650000000);

-- Product 16: Portable Bluetooth Speaker
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-16-1', 'prod-16', 'portable-bluetooth-speaker-black', 549.99, NULL, 'Black', 'One Size', 18, 1706650000000, 1706650000000),
('pv-16-2', 'prod-16', 'portable-bluetooth-speaker-blue', 549.99, NULL, 'Blue', 'One Size', 12, 1706650000000, 1706650000000),
('pv-16-3', 'prod-16', 'portable-bluetooth-speaker-red', 549.99, 649.99, 'Red', 'One Size', 10, 1706650000000, 1706650000000);

-- Product 17: Smart Home Speaker
INSERT INTO product_variant (id, product_id, sku, price, compare_at_price, color, size, stock_quantity, created_at, updated_at) VALUES
('pv-17-1', 'prod-17', 'smart-home-speaker-black', 449.99, NULL, 'Black', 'One Size', 25, 1706650000000, 1706650000000),
('pv-17-2', 'prod-17', 'smart-home-speaker-white', 449.99, NULL, 'White', 'One Size', 20, 1706650000000, 1706650000000),
('pv-17-3', 'prod-17', 'smart-home-speaker-gray', 449.99, 549.99, 'Gray', 'One Size', 15, 1706650000000, 1706650000000);

-- Product Images
INSERT INTO product_image (id, product_id, url, alt, sort) VALUES
('img-1', 'prod-1', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 'Classic Cotton T-Shirt', 0),
('img-2', 'prod-2', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500', 'Graphic Print Tee', 0),
('img-3', 'prod-3', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', 'Premium Zip Hoodie', 0),
('img-4', 'prod-4', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500', 'Pullover Comfort Hoodie', 0),
('img-5', 'prod-5', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500', 'Slim Fit Chinos', 0),
('img-6', 'prod-6', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 'Classic Denim Jeans', 0),
('img-7', 'prod-7', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 'Leather Messenger Bag', 0),
('img-8', 'prod-8', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'Canvas Backpack', 0),
('img-9', 'prod-9', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'Minimalist Steel Watch', 0),
('img-10', 'prod-10', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500', 'Sport Digital Watch', 0),
('img-11', 'prod-11', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'Urban Runner Sneakers', 0),
('img-12', 'prod-12', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500', 'Classic Canvas Sneakers', 0),
('img-13', 'prod-13', 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500', 'Leather Chelsea Boots', 0),
('img-14', 'prod-14', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Wireless Over-Ear Headphones', 0),
('img-15', 'prod-15', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', 'True Wireless Earbuds', 0),
('img-16', 'prod-16', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Portable Bluetooth Speaker', 0),
('img-17', 'prod-17', 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500', 'Smart Home Speaker', 0);
