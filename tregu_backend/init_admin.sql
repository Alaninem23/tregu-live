-- Create an admin user for Tregu
-- WARNING: change the email & password hash in production!

INSERT INTO users (email, hashed_password, role, is_active, token_version, created_at)
VALUES (
  'admin@tregu.com',
  '$2b$12$wKfpE1Yuk2I1MKV..3xeUOlx3hFRsWQbXr0JGeZz7VnGsbOzUOtQO', -- bcrypt hash for "Admin123!"
  'admin',
  true,
  0,
  NOW()
)
ON CONFLICT (email) DO NOTHING;
