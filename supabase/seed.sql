-- ============================================================
-- BloomyLMS Seed Data
-- Run AFTER schema.sql
-- Creates demo courses for all 6 categories
-- ============================================================

-- Note: Replace 'INSTRUCTOR_USER_ID' with your actual instructor profile UUID
-- You can find it in: SELECT id FROM profiles WHERE role = 'instructor' LIMIT 1;

-- ============================================================
-- DEMO COURSES
-- ============================================================

INSERT INTO courses (
  title, slug, description, short_description, category_id,
  instructor_id, price, currency, duration_weeks, difficulty,
  status, is_featured, certificate_enabled,
  what_you_learn, requirements, tags
)
SELECT
  'Linux, DevOps & Cloud Engineering',
  'linux-devops-cloud-engineering',
  'Master cloud infrastructure, CI/CD pipelines, containerization, and automation. Learn AWS, Azure, Docker, Kubernetes, Jenkins, and Terraform from scratch to expert level. Includes hands-on labs, real-world projects, and preparation for AWS Cloud Practitioner certification.',
  'Master DevOps & Cloud from beginner to expert with hands-on AWS, Docker, and Kubernetes labs.',
  c.id,
  (SELECT id FROM profiles WHERE role IN (''instructor'', ''admin'') LIMIT 1),
  150000, 'NGN', 12, 'beginner', 'published', true, true,
  ARRAY[
    'Master Linux administration and shell scripting',
    'Build CI/CD pipelines with Jenkins and GitHub Actions',
    'Deploy containerized apps with Docker and Kubernetes',
    'Provision infrastructure with Terraform and Ansible',
    'Deploy production workloads on AWS (EC2, S3, RDS, VPC)',
    'Prepare for AWS Cloud Practitioner certification'
  ],
  ARRAY[
    'Basic computer skills required',
    'No prior Linux or cloud experience needed',
    'A laptop with at least 8GB RAM recommended'
  ],
  ARRAY['Linux', 'AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Ansible', 'CI/CD', 'DevOps', 'Cloud']
FROM categories c WHERE c.slug = 'linux-devops';

INSERT INTO courses (
  title, slug, description, short_description, category_id,
  instructor_id, price, currency, duration_weeks, difficulty,
  status, is_featured, certificate_enabled,
  what_you_learn, requirements, tags
)
SELECT
  'Cybersecurity & Ethical Hacking',
  'cybersecurity-ethical-hacking',
  'Become a certified ethical hacker. Learn penetration testing, network security, vulnerability assessment, and security operations. Master tools like Metasploit, Burp Suite, Wireshark, and Nmap. Includes hands-on labs in our custom cyber range environment.',
  'Become an ethical hacker with real-world penetration testing labs and security tools.',
  c.id,
  (SELECT id FROM profiles WHERE role IN (''instructor'', ''admin'') LIMIT 1),
  150000, 'NGN', 12, 'beginner', 'published', true, true,
  ARRAY[
    'Understand how attackers think and operate',
    'Perform network and web application penetration testing',
    'Use industry tools: Metasploit, Burp Suite, Wireshark, Nmap',
    'Conduct vulnerability assessments and write reports',
    'Set up and operate a Security Operations Center (SOC)',
    'Prepare for CEH and CompTIA Security+ certifications'
  ],
  ARRAY[
    'Basic networking knowledge helpful but not required',
    'No programming experience needed',
    'Windows or Linux laptop required'
  ],
  ARRAY['Cybersecurity', 'Ethical Hacking', 'Penetration Testing', 'Network Security', 'SIEM', 'SOC', 'CEH']
FROM categories c WHERE c.slug = 'cybersecurity';

INSERT INTO courses (
  title, slug, description, short_description, category_id,
  instructor_id, price, currency, duration_weeks, difficulty,
  status, is_featured, certificate_enabled,
  what_you_learn, requirements, tags
)
SELECT
  'Data Analysis with Excel, SQL & Power BI',
  'data-analysis-excel-sql-powerbi',
  'Transform raw data into actionable insights. Master Excel for data manipulation, SQL for database queries, Power BI for visualization, and Python for advanced analytics. Build a complete data analytics portfolio with 5 real-world projects.',
  'Master Excel, SQL, Power BI, and Python to become a job-ready data analyst.',
  c.id,
  (SELECT id FROM profiles WHERE role IN (''instructor'', ''admin'') LIMIT 1),
  120000, 'NGN', 12, 'beginner', 'published', false, true,
  ARRAY[
    'Clean and analyze data with Excel and Google Sheets',
    'Write complex SQL queries for data extraction',
    'Build interactive dashboards in Power BI',
    'Use Python (Pandas, Matplotlib) for data analysis',
    'Apply statistical methods for data-driven decisions',
    'Build a professional data analytics portfolio'
  ],
  ARRAY['No prior experience needed', 'Laptop with Excel or Google Sheets'],
  ARRAY['Excel', 'SQL', 'Power BI', 'Python', 'Pandas', 'Statistics', 'Data Analytics']
FROM categories c WHERE c.slug = 'data-analysis';

INSERT INTO courses (
  title, slug, description, short_description, category_id,
  instructor_id, price, currency, duration_weeks, difficulty,
  status, is_featured, certificate_enabled,
  what_you_learn, requirements, tags
)
SELECT
  'Full-Stack Web Development',
  'full-stack-web-development',
  'Build modern web applications from scratch. Master HTML, CSS, JavaScript, React for the frontend, and Node.js with PostgreSQL for the backend. Deploy your apps to production. Build 3 complete projects for your portfolio.',
  'Build real full-stack web apps with React, Node.js, and PostgreSQL.',
  c.id,
  (SELECT id FROM profiles WHERE role IN (''instructor'', ''admin'') LIMIT 1),
  130000, 'NGN', 12, 'beginner', 'published', false, true,
  ARRAY[
    'Build responsive websites with HTML5 and CSS3',
    'Master JavaScript ES6+ and TypeScript',
    'Build SPAs with React and state management',
    'Create REST APIs with Node.js and Express',
    'Work with PostgreSQL databases and ORMs',
    'Deploy applications to Vercel and AWS'
  ],
  ARRAY['No coding experience required', 'Laptop with any OS'],
  ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript', 'REST API']
FROM categories c WHERE c.slug = 'web-development';

-- ============================================================
-- DEFAULT COHORTS for each course
-- ============================================================

INSERT INTO cohorts (course_id, name, start_date, end_date, max_students, is_open)
SELECT
  c.id,
  'April 2026 Cohort',
  '2026-04-07',
  '2026-06-27',
  50,
  true
FROM courses c
WHERE c.status = 'published';

-- ============================================================
-- SAMPLE MODULES for Linux/DevOps course
-- ============================================================

WITH course AS (SELECT id FROM courses WHERE slug = 'linux-devops-cloud-engineering' LIMIT 1)
INSERT INTO modules (course_id, title, position, is_published)
SELECT
  course.id, title, pos, true
FROM course, (VALUES
  ('Introduction to Linux & Terminal', 0),
  ('Linux Administration Deep Dive', 1),
  ('Shell Scripting & Automation', 2),
  ('Docker & Containerization', 3),
  ('Kubernetes Orchestration', 4),
  ('CI/CD with Jenkins & GitHub Actions', 5),
  ('Infrastructure as Code: Terraform', 6),
  ('Configuration Management: Ansible', 7),
  ('AWS Cloud Fundamentals', 8),
  ('AWS Advanced Services', 9),
  ('Monitoring & Observability', 10),
  ('Capstone Project', 11)
) AS t(title, pos);

-- ============================================================
-- Set admin role for seeding purposes
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================================
