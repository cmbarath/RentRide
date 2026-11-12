-- =============================================================================
-- RENTRIDE SUPABASE STORAGE BUCKETS & POLICIES
-- Migration: 004_storage_buckets.sql
-- Idempotent: safe to run multiple times
-- =============================================================================

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('vehicle-images', 'vehicle-images', true),
  ('driving-licences', 'driving-licences', false), -- PRIVATE! Strict KYC
  ('customer-avatars', 'customer-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Vehicle Images Bucket Policies
DROP POLICY IF EXISTS "Public read vehicle images storage" ON storage.objects;
CREATE POLICY "Public read vehicle images storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Admin upload vehicle images storage" ON storage.objects;
CREATE POLICY "Admin upload vehicle images storage"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'fleet_manager')))
);

-- 3. Driving Licences Bucket Policies (STRICT PRIVATE ACCESS)
-- Only document owner or Admin can read driving licence documents
DROP POLICY IF EXISTS "Owner or admin read driving licences" ON storage.objects;
CREATE POLICY "Owner or admin read driving licences"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'driving-licences' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'fleet_manager')))
  )
);

DROP POLICY IF EXISTS "User upload own driving licence" ON storage.objects;
CREATE POLICY "User upload own driving licence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'driving-licences' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Customer Avatars Bucket Policies
DROP POLICY IF EXISTS "Public read customer avatars" ON storage.objects;
CREATE POLICY "Public read customer avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-avatars');

DROP POLICY IF EXISTS "User upload own avatar" ON storage.objects;
CREATE POLICY "User upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
