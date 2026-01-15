-- Bu SQL'i Supabase'de çalıştır:

-- 1. Toplam sipariş sayısı
SELECT COUNT(*) as total_orders FROM orders;

-- 2. Unique amazon_order_id sayısı
SELECT COUNT(DISTINCT amazon_order_id) as unique_orders FROM orders;

-- 3. Duplicate siparişler varsa göster
SELECT amazon_order_id, COUNT(*) as count 
FROM orders 
GROUP BY amazon_order_id 
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;

-- 4. order_total = 0 olan siparişler
SELECT COUNT(*) as zero_total_orders FROM orders WHERE order_total = 0;

-- 5. Son 10 siparişin detayı
SELECT amazon_order_id, order_total, purchase_date, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
