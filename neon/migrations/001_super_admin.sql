-- BloomyLMS Migration 001: Add super_admin role
-- Run this in Neon SQL Editor

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
UPDATE users SET role = 'super_admin' WHERE email = 'akinolajohnayomide@gmail.com';
SELECT email, role FROM users WHERE email = 'akinolajohnayomide@gmail.com';
