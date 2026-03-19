-- ============================================================
-- BloomyLMS Seed Data for Neon
-- Run AFTER schema.sql
-- Creates a demo instructor + 4 courses + cohorts
-- ============================================================

-- Step 1: Create a demo instructor user
-- Password is: Bloomy2026! (bcrypt hash below)
INSERT INTO users (email, full_name, password_hash, role, email_verified, is_active)
VALUES (
  'instructor@bloomy360.com',
  'John Akinola',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4JzFQ1WxAi',
  'instructor',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Step 2: Insert courses using the instructor's ID
WITH inst AS (SELECT id FROM users WHERE email = 'instructor@bloomy360.com' LIMIT 1)
INSERT INTO courses (
  title, slug, description, short_description, category_id,
  instructor_id, price, currency, duration_weeks, difficulty,
  status, is_featured, certificate_enabled,
  what_you_learn, requirements, tags, total_lessons
)
SELECT title, slug, description, short_description,
  (SELECT id FROM categories WHERE slug = cat_slug LIMIT 1),
  inst.id, price, 'NGN', 12, diff::difficulty_level,
  'published', featured, true, learn, reqs, tags, lessons
FROM inst, (VALUES
  (
    'Linux, DevOps & Cloud Engineering', 'linux-devops-cloud-engineering',
    'Master cloud infrastructure, CI/CD pipelines, containerization, and automation. Learn AWS, Azure, Docker, Kubernetes, Jenkins, and Terraform from scratch to expert level. Includes hands-on labs, real-world projects, and AWS Cloud Practitioner certification prep.',
    'Master DevOps & Cloud from beginner to expert — AWS, Docker, Kubernetes, Jenkins, Terraform.',
    'linux-devops', 150000, 'beginner', true,
    ARRAY['Master Linux admin and shell scripting','Build CI/CD pipelines with Jenkins','Deploy apps with Docker and Kubernetes','Provision infrastructure with Terraform','Deploy on AWS (EC2, S3, RDS, VPC)','Prep for AWS Cloud Practitioner'],
    ARRAY['Basic computer skills','No prior Linux or cloud experience needed','Laptop with at least 8GB RAM'],
    ARRAY['Linux','AWS','Docker','Kubernetes','Jenkins','Terraform','Ansible','CI/CD','DevOps'], 48
  ),
  (
    'Cybersecurity & Ethical Hacking', 'cybersecurity-ethical-hacking',
    'Become a certified ethical hacker. Learn penetration testing, network security, vulnerability assessment, and security operations. Master tools like Metasploit, Burp Suite, Wireshark, and Nmap in a hands-on cyber range.',
    'Become an ethical hacker with real pen testing labs — Metasploit, Burp Suite, Wireshark.',
    'cybersecurity', 150000, 'beginner', true,
    ARRAY['Understand how attackers operate','Perform web app penetration testing','Use Metasploit, Burp Suite, Nmap','Write professional pentest reports','Set up a Security Operations Centre','Prep for CEH and Security+ certs'],
    ARRAY['Basic networking knowledge helpful','No programming needed','Windows or Linux laptop'],
    ARRAY['Cybersecurity','Ethical Hacking','Penetration Testing','Network Security','SIEM','SOC'], 44
  ),
  (
    'Data Analysis with Excel, SQL & Power BI', 'data-analysis-excel-sql-powerbi',
    'Transform raw data into business insights. Master Excel, SQL, Power BI, and Python for analytics. Build 5 real-world projects and a complete portfolio.',
    'Master Excel, SQL, Power BI and Python — become a job-ready data analyst.',
    'data-analysis', 120000, 'beginner', false,
    ARRAY['Clean and analyse data with Excel','Write complex SQL queries','Build dashboards in Power BI','Use Python Pandas for analysis','Apply statistical methods','Build a professional portfolio'],
    ARRAY['No prior experience needed','Laptop with Excel or Google Sheets'],
    ARRAY['Excel','SQL','Power BI','Python','Pandas','Statistics','Data Analytics'], 40
  ),
  (
    'Full-Stack Web Development', 'full-stack-web-development',
    'Build modern web apps from scratch. HTML, CSS, JavaScript, React, Node.js, PostgreSQL. Deploy 3 complete portfolio projects to production.',
    'Build real full-stack web apps — React, Node.js, PostgreSQL, deployed to production.',
    'web-development', 130000, 'beginner', false,
    ARRAY['Build responsive sites with HTML5 & CSS3','Master JavaScript ES6+ and TypeScript','Build SPAs with React','Create REST APIs with Node.js','Work with PostgreSQL','Deploy to Vercel and AWS'],
    ARRAY['No coding experience required','Laptop with any OS'],
    ARRAY['HTML','CSS','JavaScript','React','Node.js','PostgreSQL','TypeScript'], 42
  )
) AS t(title, slug, description, short_description, cat_slug, price, diff, featured, learn, reqs, tags, lessons)
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Create a default cohort for each published course
INSERT INTO cohorts (course_id, name, start_date, end_date, max_students, is_open)
SELECT id, 'April 2026 Cohort', '2026-04-07', '2026-06-27', 50, true
FROM courses
WHERE status = 'published'
ON CONFLICT DO NOTHING;

-- Step 4: Create sample modules for the DevOps course
WITH course AS (SELECT id FROM courses WHERE slug = 'linux-devops-cloud-engineering' LIMIT 1)
INSERT INTO modules (course_id, title, position, is_published)
SELECT course.id, title, pos, true
FROM course, (VALUES
  ('Introduction to Linux & Terminal', 0),
  ('Linux System Administration', 1),
  ('Shell Scripting & Automation', 2),
  ('Docker & Containerisation', 3),
  ('Kubernetes Orchestration', 4),
  ('CI/CD with Jenkins & GitHub Actions', 5),
  ('Infrastructure as Code: Terraform', 6),
  ('Configuration Management: Ansible', 7),
  ('AWS Cloud Fundamentals', 8),
  ('AWS Advanced Services', 9),
  ('Monitoring & Observability', 10),
  ('Capstone Project', 11)
) AS t(title, pos)
ON CONFLICT DO NOTHING;

-- ============================================================
-- After running this seed:
-- Login: instructor@bloomy360.com / Bloomy2026!
-- Then: UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================================
