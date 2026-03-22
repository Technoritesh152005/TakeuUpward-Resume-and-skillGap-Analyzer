const jobRoles = [

    // ─────────────────────────────────────────────
    // DEVELOPMENT (8)
    // ─────────────────────────────────────────────
    {
      title: 'Frontend Developer',
      category: 'Development',
      experienceLevel: 'Mid Level',
      description: 'Build and maintain the visual and interactive aspects of web applications using modern frontend technologies.',
      requiredSkills: {
        critical: [
          { title: 'HTML/CSS', importance: 10 },
          { title: 'JavaScript', importance: 10 },
          { title: 'React', importance: 10 },
          { title: 'Responsive Design', importance: 10 }
        ],
        important: [
          { title: 'TypeScript', importance: 7 },
          { title: 'REST APIs', importance: 7 },
          { title: 'Git', importance: 7 }
        ],
        niceToHave: [
          { title: 'Next.js', importance: 5 },
          { title: 'Testing (Jest)', importance: 5 },
          { title: 'Web Performance Optimization', importance: 5 }
        ]
      },
      responsibilities: [
        'Develop responsive UI components',
        'Collaborate with designers to implement visual designs',
        'Optimize web application performance',
        'Integrate REST/GraphQL APIs',
        'Write unit and integration tests'
      ],
      salaryRange: { min: 75000, max: 120000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Backend Developer',
      category: 'Development',
      experienceLevel: 'Mid Level',
      description: 'Design, build, and maintain server-side logic, databases, and APIs that power web applications.',
      requiredSkills: {
        critical: [
          { title: 'Node.js / Python / Java', importance: 10 },
          { title: 'RESTful API Design', importance: 10 },
          { title: 'SQL Databases', importance: 10 },
          { title: 'Server Architecture', importance: 10 }
        ],
        important: [
          { title: 'NoSQL Databases', importance: 7 },
          { title: 'Authentication & Security', importance: 7 },
          { title: 'Git', importance: 7 }
        ],
        niceToHave: [
          { title: 'Docker', importance: 5 },
          { title: 'Message Queues (Kafka/RabbitMQ)', importance: 5 },
          { title: 'GraphQL', importance: 5 }
        ]
      },
      responsibilities: [
        'Design and implement scalable server-side applications',
        'Build and document RESTful APIs',
        'Manage database schema design and optimization',
        'Implement security and data protection measures',
        'Troubleshoot and debug production issues'
      ],
      salaryRange: { min: 80000, max: 130000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Full Stack Developer',
      category: 'Development',
      experienceLevel: 'Mid Level',
      description: 'Develop end-to-end web applications, handling both frontend interfaces and backend services.',
      requiredSkills: {
        critical: [
          { title: 'JavaScript / TypeScript', importance: 10 },
          { title: 'React or Vue', importance: 10 },
          { title: 'Node.js', importance: 10 },
          { title: 'SQL & NoSQL Databases', importance: 10 }
        ],
        important: [
          { title: 'REST API Development', importance: 7 },
          { title: 'Git', importance: 7 },
          { title: 'Cloud Basics (AWS/GCP)', importance: 7 }
        ],
        niceToHave: [
          { title: 'Docker & CI/CD', importance: 5 },
          { title: 'GraphQL', importance: 5 },
          { title: 'Testing Frameworks', importance: 5 }
        ]
      },
      responsibilities: [
        'Develop and maintain full-stack web applications',
        'Design database models and API endpoints',
        'Build reusable frontend components',
        'Deploy and monitor applications in the cloud',
        'Participate in code reviews'
      ],
      salaryRange: { min: 85000, max: 135000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Mobile Developer',
      category: 'Development',
      experienceLevel: 'Mid Level',
      description: 'Design and develop mobile applications for iOS and/or Android platforms with a focus on performance and user experience.',
      requiredSkills: {
        critical: [
          { title: 'React Native / Flutter', importance: 10 },
          { title: 'iOS (Swift) or Android (Kotlin)', importance: 10 },
          { title: 'Mobile UI Design Patterns', importance: 10 },
          { title: 'REST API Integration', importance: 10 }
        ],
        important: [
          { title: 'State Management', importance: 7 },
          { title: 'Push Notifications', importance: 7 },
          { title: 'App Store Deployment', importance: 7 }
        ],
        niceToHave: [
          { title: 'Offline Storage', importance: 5 },
          { title: 'App Performance Profiling', importance: 5 },
          { title: 'Firebase', importance: 5 }
        ]
      },
      responsibilities: [
        'Build cross-platform or native mobile apps',
        'Integrate third-party SDKs and APIs',
        'Optimize app performance and memory usage',
        'Publish and maintain apps on the App Store/Play Store',
        'Write unit and UI tests'
      ],
      salaryRange: { min: 80000, max: 130000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'DevOps Engineer',
      category: 'Development',
      experienceLevel: 'Mid Level',
      description: 'Bridge development and operations by automating infrastructure, CI/CD pipelines, and ensuring system reliability.',
      requiredSkills: {
        critical: [
          { title: 'Linux/Unix Administration', importance: 10 },
          { title: 'Docker & Kubernetes', importance: 10 },
          { title: 'CI/CD Pipelines', importance: 10 },
          { title: 'Cloud Platforms (AWS/GCP/Azure)', importance: 10 }
        ],
        important: [
          { title: 'Infrastructure as Code (Terraform)', importance: 7 },
          { title: 'Monitoring & Logging', importance: 7 },
          { title: 'Scripting (Bash/Python)', importance: 7 }
        ],
        niceToHave: [
          { title: 'Security Hardening', importance: 5 },
          { title: 'Service Mesh (Istio)', importance: 5 },
          { title: 'GitOps', importance: 5 }
        ]
      },
      responsibilities: [
        'Design and manage CI/CD pipelines',
        'Provision and maintain cloud infrastructure',
        'Monitor system health and respond to incidents',
        'Automate repetitive operational tasks',
        'Collaborate with dev teams on deployment strategies'
      ],
      salaryRange: { min: 90000, max: 140000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'QA Engineer',
      category: 'Development',
      experienceLevel: 'Mid Level',
      description: 'Ensure software quality by designing and executing manual and automated tests throughout the development lifecycle.',
      requiredSkills: {
        critical: [
          { title: 'Test Planning & Strategy', importance: 10 },
          { title: 'Manual Testing', importance: 10 },
          { title: 'Automated Testing (Selenium/Cypress)', importance: 10 },
          { title: 'Bug Tracking (Jira)', importance: 10 }
        ],
        important: [
          { title: 'API Testing (Postman)', importance: 7 },
          { title: 'SQL Basics', importance: 7 },
          { title: 'CI Integration', importance: 7 }
        ],
        niceToHave: [
          { title: 'Performance Testing (JMeter)', importance: 5 },
          { title: 'Mobile Testing', importance: 5 },
          { title: 'Security Testing', importance: 5 }
        ]
      },
      responsibilities: [
        'Write and execute test cases',
        'Develop and maintain automated test suites',
        'Report and track defects',
        'Perform regression and integration testing',
        'Collaborate with developers to reproduce and resolve bugs'
      ],
      salaryRange: { min: 65000, max: 105000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Game Developer',
      category: 'Development',
      experienceLevel: 'Mid Level',
      description: 'Design and develop interactive video games for PC, console, or mobile platforms using game engines and programming.',
      requiredSkills: {
        critical: [
          { title: 'Unity or Unreal Engine', importance: 10 },
          { title: 'C# or C++', importance: 10 },
          { title: 'Game Physics & Math', importance: 10 },
          { title: '2D/3D Game Design', importance: 10 }
        ],
        important: [
          { title: 'Version Control (Git)', importance: 7 },
          { title: 'Shader Programming', importance: 7 },
          { title: 'Performance Optimization', importance: 7 }
        ],
        niceToHave: [
          { title: 'Multiplayer Networking', importance: 5 },
          { title: 'AI/Pathfinding Algorithms', importance: 5 },
          { title: 'Audio Integration', importance: 5 }
        ]
      },
      responsibilities: [
        'Develop game mechanics and systems',
        'Optimize game performance on target platforms',
        'Integrate assets from artists and designers',
        'Implement AI behaviors',
        'Debug and fix gameplay issues'
      ],
      salaryRange: { min: 70000, max: 120000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'WordPress Developer',
      category: 'Development',
      experienceLevel: 'Junior Level',
      description: 'Build and maintain WordPress websites and plugins, customizing themes and extending core functionality.',
      requiredSkills: {
        critical: [
          { title: 'WordPress CMS', importance: 10 },
          { title: 'PHP', importance: 10 },
          { title: 'HTML/CSS/JavaScript', importance: 10 },
          { title: 'Theme & Plugin Development', importance: 10 }
        ],
        important: [
          { title: 'MySQL', importance: 7 },
          { title: 'WooCommerce', importance: 7 },
          { title: 'REST API (WP)', importance: 7 }
        ],
        niceToHave: [
          { title: 'Page Builders (Elementor/Gutenberg)', importance: 5 },
          { title: 'SEO Best Practices', importance: 5 },
          { title: 'Website Security', importance: 5 }
        ]
      },
      responsibilities: [
        'Develop custom WordPress themes and plugins',
        'Maintain and update existing WordPress sites',
        'Optimize site speed and SEO',
        'Integrate third-party APIs and services',
        'Troubleshoot WordPress-specific issues'
      ],
      salaryRange: { min: 45000, max: 85000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // DATA SCIENCE (5)
    // ─────────────────────────────────────────────
    {
      title: 'Data Analyst',
      category: 'Data Science',
      experienceLevel: 'Mid Level',
      description: 'Collect, process, and analyze data to generate actionable insights that support business decision-making.',
      requiredSkills: {
        critical: [
          { title: 'SQL', importance: 10 },
          { title: 'Excel / Google Sheets', importance: 10 },
          { title: 'Data Visualization (Tableau/Power BI)', importance: 10 },
          { title: 'Statistical Analysis', importance: 10 }
        ],
        important: [
          { title: 'Python or R', importance: 7 },
          { title: 'Data Cleaning', importance: 7 },
          { title: 'Business Acumen', importance: 7 }
        ],
        niceToHave: [
          { title: 'A/B Testing', importance: 5 },
          { title: 'ETL Pipelines', importance: 5 },
          { title: 'Dashboard Automation', importance: 5 }
        ]
      },
      responsibilities: [
        'Query and clean large datasets',
        'Build dashboards and reports',
        'Identify trends and patterns in data',
        'Present findings to stakeholders',
        'Support data-driven decision-making'
      ],
      salaryRange: { min: 60000, max: 95000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Data Scientist',
      category: 'Data Science',
      experienceLevel: 'Senior Level',
      description: 'Develop advanced statistical models and machine learning solutions to solve complex business problems.',
      requiredSkills: {
        critical: [
          { title: 'Python', importance: 10 },
          { title: 'Machine Learning', importance: 10 },
          { title: 'Statistics & Probability', importance: 10 },
          { title: 'Data Wrangling (Pandas/NumPy)', importance: 10 }
        ],
        important: [
          { title: 'Deep Learning (TensorFlow/PyTorch)', importance: 7 },
          { title: 'SQL', importance: 7 },
          { title: 'Feature Engineering', importance: 7 }
        ],
        niceToHave: [
          { title: 'NLP', importance: 5 },
          { title: 'Model Deployment (MLflow)', importance: 5 },
          { title: 'Cloud ML Services', importance: 5 }
        ]
      },
      responsibilities: [
        'Formulate and test hypotheses using data',
        'Build and validate ML models',
        'Communicate insights to non-technical stakeholders',
        'Collaborate with engineering to deploy models',
        'Monitor model performance over time'
      ],
      salaryRange: { min: 100000, max: 160000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'ML Engineer',
      category: 'Data Science',
      experienceLevel: 'Senior Level',
      description: 'Design, build, and deploy scalable machine learning systems and pipelines in production environments.',
      requiredSkills: {
        critical: [
          { title: 'Python', importance: 10 },
          { title: 'Machine Learning Frameworks (TensorFlow/PyTorch)', importance: 10 },
          { title: 'MLOps & Model Deployment', importance: 10 },
          { title: 'Data Engineering', importance: 10 }
        ],
        important: [
          { title: 'Docker & Kubernetes', importance: 7 },
          { title: 'Cloud ML (AWS SageMaker/GCP Vertex)', importance: 7 },
          { title: 'CI/CD for ML', importance: 7 }
        ],
        niceToHave: [
          { title: 'Distributed Training', importance: 5 },
          { title: 'Model Monitoring', importance: 5 },
          { title: 'Feature Stores', importance: 5 }
        ]
      },
      responsibilities: [
        'Build production ML pipelines',
        'Optimize model inference for scalability',
        'Automate model retraining workflows',
        'Collaborate with data scientists on model design',
        'Monitor deployed models for drift'
      ],
      salaryRange: { min: 110000, max: 170000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'BI Analyst',
      category: 'Data Science',
      experienceLevel: 'Mid Level',
      description: 'Transform business data into strategic insights using BI tools, dashboards, and reporting systems.',
      requiredSkills: {
        critical: [
          { title: 'Power BI or Tableau', importance: 10 },
          { title: 'SQL', importance: 10 },
          { title: 'Data Modeling', importance: 10 },
          { title: 'Business Requirements Analysis', importance: 10 }
        ],
        important: [
          { title: 'DAX / MDX', importance: 7 },
          { title: 'Excel Advanced', importance: 7 },
          { title: 'ETL Processes', importance: 7 }
        ],
        niceToHave: [
          { title: 'Python for Reporting', importance: 5 },
          { title: 'Data Warehouse Concepts', importance: 5 },
          { title: 'Azure Synapse / Google BigQuery', importance: 5 }
        ]
      },
      responsibilities: [
        'Design and maintain BI dashboards',
        'Gather business requirements for reporting',
        'Create data models and pipelines',
        'Deliver insights to leadership',
        'Ensure data accuracy and integrity'
      ],
      salaryRange: { min: 65000, max: 100000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Data Engineer',
      category: 'Data Science',
      experienceLevel: 'Mid Level',
      description: 'Build and maintain data infrastructure, pipelines, and warehouses that enable analytics and machine learning.',
      requiredSkills: {
        critical: [
          { title: 'Python or Scala', importance: 10 },
          { title: 'SQL & Data Warehousing', importance: 10 },
          { title: 'ETL / ELT Pipelines', importance: 10 },
          { title: 'Apache Spark / Hadoop', importance: 10 }
        ],
        important: [
          { title: 'Airflow or dbt', importance: 7 },
          { title: 'Cloud Data Services', importance: 7 },
          { title: 'Data Modeling', importance: 7 }
        ],
        niceToHave: [
          { title: 'Kafka (Streaming Data)', importance: 5 },
          { title: 'Data Quality Frameworks', importance: 5 },
          { title: 'Snowflake / BigQuery', importance: 5 }
        ]
      },
      responsibilities: [
        'Design and build data pipelines',
        'Maintain data warehouses and lakes',
        'Ensure data reliability and quality',
        'Optimize query performance',
        'Collaborate with analysts and data scientists'
      ],
      salaryRange: { min: 90000, max: 140000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    // ─────────────────────────────────────────────
    // HEALTHCARE (6)
    // ─────────────────────────────────────────────
    {
      title: 'Registered Nurse',
      category: 'Healthcare',
      experienceLevel: 'Mid Level',
      description: 'Provide direct patient care, administer treatments, and coordinate with healthcare teams in clinical settings.',
      requiredSkills: {
        critical: [
          { title: 'Patient Assessment', importance: 10 },
          { title: 'Medication Administration', importance: 10 },
          { title: 'Clinical Documentation', importance: 10 },
          { title: 'Emergency Response', importance: 10 }
        ],
        important: [
          { title: 'IV Therapy', importance: 7 },
          { title: 'Electronic Health Records (EHR)', importance: 7 },
          { title: 'Patient Education', importance: 7 }
        ],
        niceToHave: [
          { title: 'Critical Care Certification', importance: 5 },
          { title: 'Wound Care', importance: 5 },
          { title: 'Charge Nurse Experience', importance: 5 }
        ]
      },
      responsibilities: [
        'Assess patient health conditions',
        'Administer medications and treatments',
        'Collaborate with physicians and specialists',
        'Document patient care accurately',
        'Educate patients and families on care plans'
      ],
      salaryRange: { min: 60000, max: 95000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Physical Therapist',
      category: 'Healthcare',
      experienceLevel: 'Mid Level',
      description: 'Evaluate and treat patients with physical injuries or disabilities to restore movement and improve quality of life.',
      requiredSkills: {
        critical: [
          { title: 'Patient Evaluation', importance: 10 },
          { title: 'Therapeutic Exercise', importance: 10 },
          { title: 'Manual Therapy', importance: 10 },
          { title: 'Treatment Planning', importance: 10 }
        ],
        important: [
          { title: 'Orthopedic Rehabilitation', importance: 7 },
          { title: 'Patient Education', importance: 7 },
          { title: 'Documentation (SOAP Notes)', importance: 7 }
        ],
        niceToHave: [
          { title: 'Dry Needling', importance: 5 },
          { title: 'Sports Rehabilitation', importance: 5 },
          { title: 'Aquatic Therapy', importance: 5 }
        ]
      },
      responsibilities: [
        'Diagnose movement dysfunction',
        'Design individualized treatment plans',
        'Guide patients through therapeutic exercises',
        'Monitor and document patient progress',
        'Coordinate with other healthcare providers'
      ],
      salaryRange: { min: 70000, max: 100000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Lab Technician',
      category: 'Healthcare',
      experienceLevel: 'Junior Level',
      description: 'Perform laboratory tests and analyses on patient samples to support medical diagnosis and treatment.',
      requiredSkills: {
        critical: [
          { title: 'Lab Equipment Operation', importance: 10 },
          { title: 'Sample Processing', importance: 10 },
          { title: 'Quality Control', importance: 10 },
          { title: 'Medical Terminology', importance: 10 }
        ],
        important: [
          { title: 'Hematology/Chemistry Analysis', importance: 7 },
          { title: 'HIPAA Compliance', importance: 7 },
          { title: 'Lab Information Systems', importance: 7 }
        ],
        niceToHave: [
          { title: 'Microbiology', importance: 5 },
          { title: 'Blood Banking', importance: 5 },
          { title: 'Phlebotomy', importance: 5 }
        ]
      },
      responsibilities: [
        'Process and analyze patient samples',
        'Operate and maintain lab instruments',
        'Ensure quality control standards',
        'Record and report test results accurately',
        'Follow safety protocols for biohazardous materials'
      ],
      salaryRange: { min: 38000, max: 60000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Pharmacy Technician',
      category: 'Healthcare',
      experienceLevel: 'Junior Level',
      description: 'Assist pharmacists in dispensing medications, managing inventory, and supporting patient medication management.',
      requiredSkills: {
        critical: [
          { title: 'Medication Dispensing', importance: 10 },
          { title: 'Pharmacy Software', importance: 10 },
          { title: 'Drug Knowledge', importance: 10 },
          { title: 'Accuracy & Attention to Detail', importance: 10 }
        ],
        important: [
          { title: 'Insurance Billing', importance: 7 },
          { title: 'Inventory Management', importance: 7 },
          { title: 'Customer Service', importance: 7 }
        ],
        niceToHave: [
          { title: 'Compounding', importance: 5 },
          { title: 'IV Preparation', importance: 5 },
          { title: 'HIPAA Knowledge', importance: 5 }
        ]
      },
      responsibilities: [
        'Prepare and dispense prescriptions',
        'Process insurance claims',
        'Maintain medication inventory',
        'Assist patients with questions',
        'Ensure compliance with pharmacy regulations'
      ],
      salaryRange: { min: 33000, max: 52000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Dental Hygienist',
      category: 'Healthcare',
      experienceLevel: 'Mid Level',
      description: 'Provide preventive dental care including cleanings, X-rays, and patient education on oral health.',
      requiredSkills: {
        critical: [
          { title: 'Oral Prophylaxis', importance: 10 },
          { title: 'Dental X-ray', importance: 10 },
          { title: 'Periodontal Assessment', importance: 10 },
          { title: 'Patient Education', importance: 10 }
        ],
        important: [
          { title: 'Dental Software (Dentrix)', importance: 7 },
          { title: 'Infection Control', importance: 7 },
          { title: 'Local Anesthesia', importance: 7 }
        ],
        niceToHave: [
          { title: 'Laser Dentistry', importance: 5 },
          { title: 'Orthodontic Assistance', importance: 5 },
          { title: 'Pediatric Dental Care', importance: 5 }
        ]
      },
      responsibilities: [
        'Perform professional teeth cleanings',
        'Take and evaluate dental X-rays',
        'Screen patients for oral diseases',
        'Educate patients on oral hygiene',
        'Document patient records accurately'
      ],
      salaryRange: { min: 65000, max: 90000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Medical Assistant',
      category: 'Healthcare',
      experienceLevel: 'Junior Level',
      description: 'Support physicians and clinical staff by performing administrative and clinical tasks in healthcare settings.',
      requiredSkills: {
        critical: [
          { title: 'Vital Signs Measurement', importance: 10 },
          { title: 'EHR Systems', importance: 10 },
          { title: 'Patient Intake', importance: 10 },
          { title: 'Medical Terminology', importance: 10 }
        ],
        important: [
          { title: 'Phlebotomy', importance: 7 },
          { title: 'Scheduling & Billing', importance: 7 },
          { title: 'Sterilization Techniques', importance: 7 }
        ],
        niceToHave: [
          { title: 'EKG Administration', importance: 5 },
          { title: 'Medical Coding (ICD-10)', importance: 5 },
          { title: 'Injection Administration', importance: 5 }
        ]
      },
      responsibilities: [
        'Greet and prepare patients for exams',
        'Record medical histories and vital signs',
        'Assist physicians during examinations',
        'Process prescriptions and referrals',
        'Manage administrative tasks and scheduling'
      ],
      salaryRange: { min: 32000, max: 48000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    // ─────────────────────────────────────────────
    // EDUCATION (4)
    // ─────────────────────────────────────────────
    {
      title: 'Elementary School Teacher',
      category: 'Education',
      experienceLevel: 'Mid Level',
      description: 'Educate and nurture students in grades K–5 across core subjects, fostering foundational academic and social skills.',
      requiredSkills: {
        critical: [
          { title: 'Curriculum Planning', importance: 10 },
          { title: 'Classroom Management', importance: 10 },
          { title: 'Differentiated Instruction', importance: 10 },
          { title: 'Child Development Knowledge', importance: 10 }
        ],
        important: [
          { title: 'Formative Assessment', importance: 7 },
          { title: 'Parent Communication', importance: 7 },
          { title: 'IEP Implementation', importance: 7 }
        ],
        niceToHave: [
          { title: 'STEM Integration', importance: 5 },
          { title: 'Ed Tech Tools', importance: 5 },
          { title: 'Bilingual Instruction', importance: 5 }
        ]
      },
      responsibilities: [
        'Design and deliver lesson plans',
        'Assess and track student progress',
        'Maintain a positive classroom environment',
        'Communicate with parents and guardians',
        'Participate in staff meetings and professional development'
      ],
      salaryRange: { min: 42000, max: 68000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'High School Teacher',
      category: 'Education',
      experienceLevel: 'Mid Level',
      description: 'Deliver subject-specific instruction to students in grades 9–12, preparing them for college and careers.',
      requiredSkills: {
        critical: [
          { title: 'Subject Matter Expertise', importance: 10 },
          { title: 'Lesson Planning', importance: 10 },
          { title: 'Classroom Management', importance: 10 },
          { title: 'Assessment Design', importance: 10 }
        ],
        important: [
          { title: 'Critical Thinking Facilitation', importance: 7 },
          { title: 'Student Mentoring', importance: 7 },
          { title: 'Educational Technology', importance: 7 }
        ],
        niceToHave: [
          { title: 'AP / IB Course Experience', importance: 5 },
          { title: 'Extracurricular Coaching', importance: 5 },
          { title: 'College Counseling', importance: 5 }
        ]
      },
      responsibilities: [
        'Teach subject-specific curriculum',
        'Prepare students for standardized tests',
        'Grade and provide feedback on assignments',
        'Support students with academic challenges',
        'Collaborate with department and faculty'
      ],
      salaryRange: { min: 46000, max: 75000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Corporate Trainer',
      category: 'Education',
      experienceLevel: 'Mid Level',
      description: 'Design and deliver corporate training programs to improve employee skills, performance, and engagement.',
      requiredSkills: {
        critical: [
          { title: 'Instructional Design', importance: 10 },
          { title: 'Training Delivery', importance: 10 },
          { title: 'Adult Learning Principles', importance: 10 },
          { title: 'Needs Assessment', importance: 10 }
        ],
        important: [
          { title: 'E-Learning Tools (Articulate)', importance: 7 },
          { title: 'Presentation Skills', importance: 7 },
          { title: 'Training Evaluation', importance: 7 }
        ],
        niceToHave: [
          { title: 'LMS Administration', importance: 5 },
          { title: 'Leadership Development', importance: 5 },
          { title: 'Change Management', importance: 5 }
        ]
      },
      responsibilities: [
        'Conduct training needs analysis',
        'Develop engaging training materials',
        'Facilitate workshops and seminars',
        'Measure training effectiveness with KPIs',
        'Partner with HR and department heads'
      ],
      salaryRange: { min: 55000, max: 85000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Online Instructor',
      category: 'Education',
      experienceLevel: 'Mid Level',
      description: 'Develop and teach online courses, engaging learners through digital platforms and asynchronous content.',
      requiredSkills: {
        critical: [
          { title: 'Online Course Design', importance: 10 },
          { title: 'LMS (Canvas/Moodle)', importance: 10 },
          { title: 'Subject Matter Expertise', importance: 10 },
          { title: 'Digital Communication', importance: 10 }
        ],
        important: [
          { title: 'Video Production', importance: 7 },
          { title: 'Student Engagement Techniques', importance: 7 },
          { title: 'Assessment Design', importance: 7 }
        ],
        niceToHave: [
          { title: 'SCORM/xAPI Knowledge', importance: 5 },
          { title: 'Accessibility Standards', importance: 5 },
          { title: 'Gamification', importance: 5 }
        ]
      },
      responsibilities: [
        'Create and update online course content',
        'Facilitate discussions and provide feedback',
        'Track learner progress and outcomes',
        'Ensure course meets quality standards',
        'Respond to student inquiries promptly'
      ],
      salaryRange: { min: 45000, max: 75000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // FINANCE (5)
    // ─────────────────────────────────────────────
    {
      title: 'Accountant',
      category: 'Finance',
      experienceLevel: 'Mid Level',
      description: 'Manage financial records, prepare statements, and ensure regulatory compliance for organizations.',
      requiredSkills: {
        critical: [
          { title: 'GAAP / IFRS', importance: 10 },
          { title: 'Financial Statements', importance: 10 },
          { title: 'Accounts Payable/Receivable', importance: 10 },
          { title: 'Accounting Software (QuickBooks/SAP)', importance: 10 }
        ],
        important: [
          { title: 'Tax Compliance', importance: 7 },
          { title: 'Reconciliation', importance: 7 },
          { title: 'Excel (Advanced)', importance: 7 }
        ],
        niceToHave: [
          { title: 'CPA Certification', importance: 5 },
          { title: 'Payroll Processing', importance: 5 },
          { title: 'Audit Support', importance: 5 }
        ]
      },
      responsibilities: [
        'Maintain general ledger entries',
        'Prepare monthly and annual financial reports',
        'Ensure tax compliance and filings',
        'Conduct account reconciliations',
        'Support internal and external audits'
      ],
      salaryRange: { min: 55000, max: 85000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Financial Analyst',
      category: 'Finance',
      experienceLevel: 'Mid Level',
      description: 'Analyze financial data and trends to support budgeting, forecasting, and strategic investment decisions.',
      requiredSkills: {
        critical: [
          { title: 'Financial Modeling', importance: 10 },
          { title: 'Excel & Data Analysis', importance: 10 },
          { title: 'Budgeting & Forecasting', importance: 10 },
          { title: 'Variance Analysis', importance: 10 }
        ],
        important: [
          { title: 'Valuation Methods (DCF/Comps)', importance: 7 },
          { title: 'Business Intelligence Tools', importance: 7 },
          { title: 'Financial Reporting', importance: 7 }
        ],
        niceToHave: [
          { title: 'CFA Progress', importance: 5 },
          { title: 'ERP Systems (SAP/Oracle)', importance: 5 },
          { title: 'Python for Finance', importance: 5 }
        ]
      },
      responsibilities: [
        'Develop financial models and forecasts',
        'Analyze business performance against budget',
        'Prepare investment and financial reports',
        'Support strategic planning processes',
        'Present findings to senior management'
      ],
      salaryRange: { min: 65000, max: 105000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Bank Teller',
      category: 'Finance',
      experienceLevel: 'Entry Level',
      description: 'Process customer banking transactions and provide frontline customer service in a bank branch.',
      requiredSkills: {
        critical: [
          { title: 'Cash Handling', importance: 10 },
          { title: 'Banking Software', importance: 10 },
          { title: 'Customer Service', importance: 10 },
          { title: 'Numerical Accuracy', importance: 10 }
        ],
        important: [
          { title: 'Fraud Detection Awareness', importance: 7 },
          { title: 'Compliance (KYC/AML)', importance: 7 },
          { title: 'Balancing Drawer', importance: 7 }
        ],
        niceToHave: [
          { title: 'Cross-selling Skills', importance: 5 },
          { title: 'Foreign Currency Handling', importance: 5 },
          { title: 'Notary Services', importance: 5 }
        ]
      },
      responsibilities: [
        'Process deposits, withdrawals, and transfers',
        'Verify customer identities',
        'Balance daily cash drawer',
        'Identify and report suspicious activity',
        'Assist customers with account inquiries'
      ],
      salaryRange: { min: 30000, max: 45000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Investment Analyst',
      category: 'Finance',
      experienceLevel: 'Mid Level',
      description: 'Evaluate investment opportunities by conducting in-depth financial and market research for portfolio decision-making.',
      requiredSkills: {
        critical: [
          { title: 'Equity Research', importance: 10 },
          { title: 'Financial Modeling (DCF, LBO)', importance: 10 },
          { title: 'Industry & Competitive Analysis', importance: 10 },
          { title: 'Bloomberg / FactSet', importance: 10 }
        ],
        important: [
          { title: 'Portfolio Theory', importance: 7 },
          { title: 'Financial Statement Analysis', importance: 7 },
          { title: 'Risk Assessment', importance: 7 }
        ],
        niceToHave: [
          { title: 'CFA Designation', importance: 5 },
          { title: 'Alternative Investments', importance: 5 },
          { title: 'Quantitative Analysis', importance: 5 }
        ]
      },
      responsibilities: [
        'Research and evaluate investment opportunities',
        'Build detailed financial models',
        'Prepare investment memos and recommendations',
        'Monitor existing portfolio companies',
        'Present analysis to investment committees'
      ],
      salaryRange: { min: 75000, max: 120000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Tax Accountant',
      category: 'Finance',
      experienceLevel: 'Mid Level',
      description: 'Prepare and file tax returns, ensure tax compliance, and identify tax-saving strategies for individuals and businesses.',
      requiredSkills: {
        critical: [
          { title: 'Tax Preparation (Federal & State)', importance: 10 },
          { title: 'Tax Code Knowledge (IRC)', importance: 10 },
          { title: 'Accounting Software (ProConnect/Lacerte)', importance: 10 },
          { title: 'Tax Planning', importance: 10 }
        ],
        important: [
          { title: 'Corporate Tax Returns', importance: 7 },
          { title: 'Deferred Tax Calculations', importance: 7 },
          { title: 'Client Communication', importance: 7 }
        ],
        niceToHave: [
          { title: 'CPA License', importance: 5 },
          { title: 'International Tax', importance: 5 },
          { title: 'Sales & Use Tax', importance: 5 }
        ]
      },
      responsibilities: [
        'Prepare individual and business tax returns',
        'Advise clients on tax-reduction strategies',
        'Ensure compliance with tax laws',
        'Represent clients during tax audits',
        'Stay current on tax code changes'
      ],
      salaryRange: { min: 58000, max: 90000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // MARKETING (4)
    // ─────────────────────────────────────────────
    {
      title: 'Digital Marketing Specialist',
      category: 'Marketing',
      experienceLevel: 'Mid Level',
      description: 'Plan and execute digital marketing campaigns across paid, owned, and earned channels to drive growth.',
      requiredSkills: {
        critical: [
          { title: 'Google Ads & Meta Ads', importance: 10 },
          { title: 'SEO/SEM', importance: 10 },
          { title: 'Analytics (Google Analytics 4)', importance: 10 },
          { title: 'Email Marketing', importance: 10 }
        ],
        important: [
          { title: 'Marketing Automation (HubSpot)', importance: 7 },
          { title: 'A/B Testing', importance: 7 },
          { title: 'Content Strategy', importance: 7 }
        ],
        niceToHave: [
          { title: 'Programmatic Advertising', importance: 5 },
          { title: 'Conversion Rate Optimization', importance: 5 },
          { title: 'Affiliate Marketing', importance: 5 }
        ]
      },
      responsibilities: [
        'Manage PPC and paid social campaigns',
        'Analyze campaign performance and optimize ROI',
        'Create and distribute email campaigns',
        'Conduct keyword research',
        'Report on marketing KPIs'
      ],
      salaryRange: { min: 55000, max: 90000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Content Manager',
      category: 'Marketing',
      experienceLevel: 'Mid Level',
      description: 'Oversee content strategy, creation, and publishing to engage audiences and support marketing goals.',
      requiredSkills: {
        critical: [
          { title: 'Content Strategy', importance: 10 },
          { title: 'Copywriting & Editing', importance: 10 },
          { title: 'CMS (WordPress/Contentful)', importance: 10 },
          { title: 'Editorial Calendar Management', importance: 10 }
        ],
        important: [
          { title: 'SEO Writing', importance: 7 },
          { title: 'Social Media Content', importance: 7 },
          { title: 'Team Coordination', importance: 7 }
        ],
        niceToHave: [
          { title: 'Video & Podcast Production', importance: 5 },
          { title: 'Content Analytics', importance: 5 },
          { title: 'Brand Voice Development', importance: 5 }
        ]
      },
      responsibilities: [
        'Develop and manage content calendar',
        'Write, edit, and publish high-quality content',
        'Optimize content for SEO',
        'Coordinate freelancers and content contributors',
        'Track and report content performance'
      ],
      salaryRange: { min: 55000, max: 85000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'SEO Specialist',
      category: 'Marketing',
      experienceLevel: 'Mid Level',
      description: 'Improve organic search rankings through on-page, off-page, and technical SEO strategies.',
      requiredSkills: {
        critical: [
          { title: 'Keyword Research', importance: 10 },
          { title: 'On-Page SEO', importance: 10 },
          { title: 'Technical SEO', importance: 10 },
          { title: 'Google Search Console', importance: 10 }
        ],
        important: [
          { title: 'Link Building', importance: 7 },
          { title: 'SEO Tools (Ahrefs/SEMrush)', importance: 7 },
          { title: 'Content Optimization', importance: 7 }
        ],
        niceToHave: [
          { title: 'Local SEO', importance: 5 },
          { title: 'Core Web Vitals', importance: 5 },
          { title: 'Schema Markup', importance: 5 }
        ]
      },
      responsibilities: [
        'Conduct SEO audits and competitive analysis',
        'Optimize site structure and content',
        'Build and manage backlink profiles',
        'Monitor rankings and traffic',
        'Recommend technical SEO improvements'
      ],
      salaryRange: { min: 50000, max: 80000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Brand Manager',
      category: 'Marketing',
      experienceLevel: 'Senior Level',
      description: 'Define and maintain brand identity, strategy, and positioning to build brand equity and market presence.',
      requiredSkills: {
        critical: [
          { title: 'Brand Strategy', importance: 10 },
          { title: 'Market Research', importance: 10 },
          { title: 'Campaign Management', importance: 10 },
          { title: 'Brand Guidelines', importance: 10 }
        ],
        important: [
          { title: 'Consumer Insights', importance: 7 },
          { title: 'Cross-functional Leadership', importance: 7 },
          { title: 'Competitive Analysis', importance: 7 }
        ],
        niceToHave: [
          { title: 'Product Launches', importance: 5 },
          { title: 'Agency Management', importance: 5 },
          { title: 'P&L Ownership', importance: 5 }
        ]
      },
      responsibilities: [
        'Define and execute brand positioning strategy',
        'Oversee brand guidelines and visual identity',
        'Lead integrated marketing campaigns',
        'Analyze brand health and market share',
        'Manage agency and vendor relationships'
      ],
      salaryRange: { min: 75000, max: 120000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // SALES (3)
    // ─────────────────────────────────────────────
    {
      title: 'Sales Representative',
      category: 'Sales',
      experienceLevel: 'Junior Level',
      description: 'Generate new business by prospecting leads, presenting solutions, and closing sales for products or services.',
      requiredSkills: {
        critical: [
          { title: 'Prospecting & Cold Outreach', importance: 10 },
          { title: 'Sales Presentations', importance: 10 },
          { title: 'CRM Software (Salesforce)', importance: 10 },
          { title: 'Objection Handling', importance: 10 }
        ],
        important: [
          { title: 'Product Knowledge', importance: 7 },
          { title: 'Pipeline Management', importance: 7 },
          { title: 'Negotiation', importance: 7 }
        ],
        niceToHave: [
          { title: 'B2B Sales Experience', importance: 5 },
          { title: 'Territory Management', importance: 5 },
          { title: 'Solution Selling', importance: 5 }
        ]
      },
      responsibilities: [
        'Identify and qualify prospects',
        'Conduct product demos and presentations',
        'Manage sales pipeline in CRM',
        'Close deals and meet quota',
        'Maintain customer relationships post-sale'
      ],
      salaryRange: { min: 40000, max: 70000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Account Executive',
      category: 'Sales',
      experienceLevel: 'Mid Level',
      description: 'Own the full sales cycle from prospecting to close, managing key client accounts and driving revenue growth.',
      requiredSkills: {
        critical: [
          { title: 'Full-Cycle Sales', importance: 10 },
          { title: 'Account Management', importance: 10 },
          { title: 'CRM (Salesforce/HubSpot)', importance: 10 },
          { title: 'Contract Negotiation', importance: 10 }
        ],
        important: [
          { title: 'Solution Selling', importance: 7 },
          { title: 'Forecasting', importance: 7 },
          { title: 'Executive-Level Communication', importance: 7 }
        ],
        niceToHave: [
          { title: 'SaaS Sales Experience', importance: 5 },
          { title: 'MEDDIC/SPIN Methodology', importance: 5 },
          { title: 'Channel Partnerships', importance: 5 }
        ]
      },
      responsibilities: [
        'Manage and grow a portfolio of accounts',
        'Lead complex sales negotiations',
        'Build relationships with key decision-makers',
        'Forecast and track revenue in CRM',
        'Collaborate with customer success teams'
      ],
      salaryRange: { min: 65000, max: 120000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Business Development Manager',
      category: 'Sales',
      experienceLevel: 'Senior Level',
      description: 'Identify, develop, and secure new business opportunities through partnerships, markets, and strategic sales initiatives.',
      requiredSkills: {
        critical: [
          { title: 'New Business Development', importance: 10 },
          { title: 'Strategic Partnerships', importance: 10 },
          { title: 'Market Research & Analysis', importance: 10 },
          { title: 'Executive Relationship Management', importance: 10 }
        ],
        important: [
          { title: 'Contract & Deal Structuring', importance: 7 },
          { title: 'Sales Strategy', importance: 7 },
          { title: 'Cross-functional Collaboration', importance: 7 }
        ],
        niceToHave: [
          { title: 'M&A Familiarity', importance: 5 },
          { title: 'International Business Development', importance: 5 },
          { title: 'Go-to-Market Strategy', importance: 5 }
        ]
      },
      responsibilities: [
        'Identify and evaluate new market opportunities',
        'Develop and manage strategic partnerships',
        'Lead RFP and proposal processes',
        'Build and present business cases to leadership',
        'Drive revenue through new channels'
      ],
      salaryRange: { min: 85000, max: 140000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // DESIGN (3)
    // ─────────────────────────────────────────────
    {
      title: 'Graphic Designer',
      category: 'Design',
      experienceLevel: 'Mid Level',
      description: 'Create visual content including logos, marketing materials, and digital assets that communicate brand messages.',
      requiredSkills: {
        critical: [
          { title: 'Adobe Illustrator', importance: 10 },
          { title: 'Adobe Photoshop', importance: 10 },
          { title: 'Typography', importance: 10 },
          { title: 'Brand Identity Design', importance: 10 }
        ],
        important: [
          { title: 'InDesign', importance: 7 },
          { title: 'Color Theory', importance: 7 },
          { title: 'Layout Design', importance: 7 }
        ],
        niceToHave: [
          { title: 'Motion Graphics (After Effects)', importance: 5 },
          { title: 'Web Design Basics', importance: 5 },
          { title: 'Print Production', importance: 5 }
        ]
      },
      responsibilities: [
        'Design logos, brochures, and digital graphics',
        'Maintain visual brand consistency',
        'Collaborate with marketing and product teams',
        'Prepare files for print and digital production',
        'Present creative concepts to stakeholders'
      ],
      salaryRange: { min: 45000, max: 80000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'UX/UI Designer',
      category: 'Design',
      experienceLevel: 'Mid Level',
      description: 'Design intuitive and visually engaging user experiences for web and mobile applications.',
      requiredSkills: {
        critical: [
          { title: 'Figma', importance: 10 },
          { title: 'User Research', importance: 10 },
          { title: 'Wireframing & Prototyping', importance: 10 },
          { title: 'Interaction Design', importance: 10 }
        ],
        important: [
          { title: 'Usability Testing', importance: 7 },
          { title: 'Design Systems', importance: 7 },
          { title: 'Accessibility (WCAG)', importance: 7 }
        ],
        niceToHave: [
          { title: 'Front-end Basics (HTML/CSS)', importance: 5 },
          { title: 'Motion Design', importance: 5 },
          { title: 'A/B Testing', importance: 5 }
        ]
      },
      responsibilities: [
        'Conduct user research and personas',
        'Create wireframes, mockups, and prototypes',
        'Design cohesive UI components and systems',
        'Collaborate with product and engineering',
        'Iterate designs based on user feedback'
      ],
      salaryRange: { min: 70000, max: 115000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Product Designer',
      category: 'Design',
      experienceLevel: 'Senior Level',
      description: 'Own end-to-end product design from discovery to delivery, aligning user needs with business goals.',
      requiredSkills: {
        critical: [
          { title: 'Product Thinking', importance: 10 },
          { title: 'Figma / Sketch', importance: 10 },
          { title: 'User-Centered Design', importance: 10 },
          { title: 'Systems Thinking', importance: 10 }
        ],
        important: [
          { title: 'Stakeholder Management', importance: 7 },
          { title: 'Data-Informed Design', importance: 7 },
          { title: 'Design Critique & Feedback', importance: 7 }
        ],
        niceToHave: [
          { title: 'Service Design', importance: 5 },
          { title: 'Design Strategy', importance: 5 },
          { title: 'Mentoring Junior Designers', importance: 5 }
        ]
      },
      responsibilities: [
        'Define product design strategy and vision',
        'Lead discovery research and problem framing',
        'Design and validate product experiences',
        'Build and maintain design systems',
        'Partner closely with PMs and engineers'
      ],
      salaryRange: { min: 90000, max: 145000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    // ─────────────────────────────────────────────
    // HOSPITALITY (3)
    // ─────────────────────────────────────────────
    {
      title: 'Front Desk Agent',
      category: 'Hospitality',
      experienceLevel: 'Entry Level',
      description: 'Welcome and assist hotel guests, managing check-in/out, reservations, and providing excellent customer service.',
      requiredSkills: {
        critical: [
          { title: 'Guest Relations', importance: 10 },
          { title: 'Hotel PMS (Opera/Fosse)', importance: 10 },
          { title: 'Reservations Management', importance: 10 },
          { title: 'Problem Resolution', importance: 10 }
        ],
        important: [
          { title: 'Upselling Techniques', importance: 7 },
          { title: 'Cash Handling', importance: 7 },
          { title: 'Multi-tasking', importance: 7 }
        ],
        niceToHave: [
          { title: 'Second Language', importance: 5 },
          { title: 'Loyalty Program Knowledge', importance: 5 },
          { title: 'Night Audit', importance: 5 }
        ]
      },
      responsibilities: [
        'Check guests in and out efficiently',
        'Handle reservations and inquiries',
        'Process payments and billing',
        'Address and resolve guest complaints',
        'Coordinate with housekeeping and concierge'
      ],
      salaryRange: { min: 28000, max: 42000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Restaurant Manager',
      category: 'Hospitality',
      experienceLevel: 'Mid Level',
      description: 'Oversee restaurant operations including staff management, customer experience, and financial performance.',
      requiredSkills: {
        critical: [
          { title: 'Restaurant Operations', importance: 10 },
          { title: 'Team Leadership', importance: 10 },
          { title: 'Customer Service', importance: 10 },
          { title: 'Food Safety Compliance', importance: 10 }
        ],
        important: [
          { title: 'Inventory Management', importance: 7 },
          { title: 'Scheduling', importance: 7 },
          { title: 'P&L Management', importance: 7 }
        ],
        niceToHave: [
          { title: 'Point of Sale Systems', importance: 5 },
          { title: 'Menu Development', importance: 5 },
          { title: 'Catering Operations', importance: 5 }
        ]
      },
      responsibilities: [
        'Manage daily restaurant operations',
        'Hire, train, and supervise staff',
        'Ensure food quality and safety standards',
        'Control costs and manage budgets',
        'Handle customer complaints and feedback'
      ],
      salaryRange: { min: 48000, max: 75000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Event Coordinator',
      category: 'Hospitality',
      experienceLevel: 'Mid Level',
      description: 'Plan and execute events including conferences, weddings, and corporate gatherings from conception to completion.',
      requiredSkills: {
        critical: [
          { title: 'Event Planning & Logistics', importance: 10 },
          { title: 'Vendor Management', importance: 10 },
          { title: 'Budget Management', importance: 10 },
          { title: 'Client Communication', importance: 10 }
        ],
        important: [
          { title: 'Contract Negotiation', importance: 7 },
          { title: 'Timeline Management', importance: 7 },
          { title: 'On-site Coordination', importance: 7 }
        ],
        niceToHave: [
          { title: 'Event Management Software', importance: 5 },
          { title: 'Marketing/Promotion', importance: 5 },
          { title: 'CMP Certification', importance: 5 }
        ]
      },
      responsibilities: [
        'Plan and manage event timelines',
        'Source and coordinate vendors',
        'Manage event budgets and track expenses',
        'Oversee on-site event execution',
        'Debrief and document lessons learned'
      ],
      salaryRange: { min: 42000, max: 65000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // HR (3)
    // ─────────────────────────────────────────────
    {
      title: 'HR Coordinator',
      category: 'HR',
      experienceLevel: 'Junior Level',
      description: 'Support HR operations including onboarding, record management, and employee relations.',
      requiredSkills: {
        critical: [
          { title: 'HRIS (Workday/BambooHR)', importance: 10 },
          { title: 'Onboarding', importance: 10 },
          { title: 'Employee Records Management', importance: 10 },
          { title: 'HR Compliance', importance: 10 }
        ],
        important: [
          { title: 'Benefits Administration', importance: 7 },
          { title: 'Payroll Coordination', importance: 7 },
          { title: 'Communication Skills', importance: 7 }
        ],
        niceToHave: [
          { title: 'Recruitment Support', importance: 5 },
          { title: 'Training Coordination', importance: 5 },
          { title: 'SHRM-CP Progress', importance: 5 }
        ]
      },
      responsibilities: [
        'Coordinate new hire onboarding',
        'Maintain employee records',
        'Support benefits enrollment',
        'Assist with HR compliance documentation',
        'Respond to employee HR inquiries'
      ],
      salaryRange: { min: 40000, max: 58000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Recruiter',
      category: 'HR',
      experienceLevel: 'Mid Level',
      description: 'Source, screen, and hire top talent across various roles using multiple recruitment channels and strategies.',
      requiredSkills: {
        critical: [
          { title: 'Full-Cycle Recruiting', importance: 10 },
          { title: 'ATS (Greenhouse/Lever)', importance: 10 },
          { title: 'Candidate Sourcing', importance: 10 },
          { title: 'Interviewing Techniques', importance: 10 }
        ],
        important: [
          { title: 'LinkedIn Recruiting', importance: 7 },
          { title: 'Offer Negotiation', importance: 7 },
          { title: 'Job Description Writing', importance: 7 }
        ],
        niceToHave: [
          { title: 'Employer Branding', importance: 5 },
          { title: 'DEI Hiring Practices', importance: 5 },
          { title: 'Technical Recruiting', importance: 5 }
        ]
      },
      responsibilities: [
        'Manage end-to-end recruitment process',
        'Source candidates through various channels',
        'Screen and interview applicants',
        'Coordinate and extend offers',
        'Build talent pipelines for future roles'
      ],
      salaryRange: { min: 50000, max: 80000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'HR Manager',
      category: 'HR',
      experienceLevel: 'Senior Level',
      description: 'Lead HR strategy and operations including talent management, employee relations, and organizational development.',
      requiredSkills: {
        critical: [
          { title: 'HR Strategy', importance: 10 },
          { title: 'Employee Relations', importance: 10 },
          { title: 'Performance Management', importance: 10 },
          { title: 'HR Compliance & Labor Law', importance: 10 }
        ],
        important: [
          { title: 'Organizational Development', importance: 7 },
          { title: 'Compensation & Benefits', importance: 7 },
          { title: 'HRIS Management', importance: 7 }
        ],
        niceToHave: [
          { title: 'SHRM-SCP Certification', importance: 5 },
          { title: 'Change Management', importance: 5 },
          { title: 'Succession Planning', importance: 5 }
        ]
      },
      responsibilities: [
        'Develop and implement HR policies',
        'Manage employee relations and conflict resolution',
        'Oversee talent acquisition and retention',
        'Lead performance review processes',
        'Ensure legal compliance and risk management'
      ],
      salaryRange: { min: 75000, max: 115000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // CUSTOMER SERVICE (2)
    // ─────────────────────────────────────────────
    {
      title: 'Customer Service Representative',
      category: 'Customer Service',
      experienceLevel: 'Entry Level',
      description: 'Resolve customer inquiries, complaints, and requests via phone, email, and chat with a focus on satisfaction.',
      requiredSkills: {
        critical: [
          { title: 'Communication Skills', importance: 10 },
          { title: 'Problem Solving', importance: 10 },
          { title: 'CRM Software', importance: 10 },
          { title: 'Active Listening', importance: 10 }
        ],
        important: [
          { title: 'Conflict Resolution', importance: 7 },
          { title: 'Product Knowledge', importance: 7 },
          { title: 'Data Entry Accuracy', importance: 7 }
        ],
        niceToHave: [
          { title: 'Bilingual', importance: 5 },
          { title: 'Chat Support Tools', importance: 5 },
          { title: 'Upselling', importance: 5 }
        ]
      },
      responsibilities: [
        'Respond to customer inquiries via multiple channels',
        'Resolve complaints with empathy and efficiency',
        'Document interactions in CRM',
        'Escalate complex issues to senior staff',
        'Meet SLA and satisfaction targets'
      ],
      salaryRange: { min: 30000, max: 45000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Customer Success Manager',
      category: 'Customer Service',
      experienceLevel: 'Mid Level',
      description: 'Drive customer adoption, retention, and satisfaction by proactively managing customer relationships and outcomes.',
      requiredSkills: {
        critical: [
          { title: 'Relationship Management', importance: 10 },
          { title: 'Customer Onboarding', importance: 10 },
          { title: 'Churn Prevention', importance: 10 },
          { title: 'CRM (Gainsight/Salesforce)', importance: 10 }
        ],
        important: [
          { title: 'Product Knowledge', importance: 7 },
          { title: 'Data Analysis', importance: 7 },
          { title: 'Upsell & Expansion Revenue', importance: 7 }
        ],
        niceToHave: [
          { title: 'QBR Facilitation', importance: 5 },
          { title: 'Implementation Experience', importance: 5 },
          { title: 'SaaS Metrics (NRR, GRR)', importance: 5 }
        ]
      },
      responsibilities: [
        'Manage a portfolio of customer accounts',
        'Drive product adoption and value realization',
        'Identify renewal and upsell opportunities',
        'Conduct quarterly business reviews',
        'Act as voice of customer to product teams'
      ],
      salaryRange: { min: 65000, max: 105000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    // ─────────────────────────────────────────────
    // CONSTRUCTION (2)
    // ─────────────────────────────────────────────
    {
      title: 'Civil Engineer',
      category: 'Construction',
      experienceLevel: 'Mid Level',
      description: 'Design, plan, and oversee construction of infrastructure projects including roads, bridges, and buildings.',
      requiredSkills: {
        critical: [
          { title: 'Structural Analysis', importance: 10 },
          { title: 'AutoCAD / Civil 3D', importance: 10 },
          { title: 'Project Management', importance: 10 },
          { title: 'Site Engineering', importance: 10 }
        ],
        important: [
          { title: 'Geotechnical Knowledge', importance: 7 },
          { title: 'Construction Codes & Regulations', importance: 7 },
          { title: 'Cost Estimation', importance: 7 }
        ],
        niceToHave: [
          { title: 'PE License', importance: 5 },
          { title: 'Environmental Compliance', importance: 5 },
          { title: 'BIM (Revit)', importance: 5 }
        ]
      },
      responsibilities: [
        'Design civil infrastructure systems',
        'Manage project timelines and budgets',
        'Conduct site inspections',
        'Review contractor submittals',
        'Ensure regulatory compliance'
      ],
      salaryRange: { min: 70000, max: 110000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Electrician',
      category: 'Construction',
      experienceLevel: 'Mid Level',
      description: 'Install, maintain, and repair electrical systems in residential, commercial, and industrial settings.',
      requiredSkills: {
        critical: [
          { title: 'Electrical Wiring & Circuits', importance: 10 },
          { title: 'National Electrical Code (NEC)', importance: 10 },
          { title: 'Blueprint Reading', importance: 10 },
          { title: 'Troubleshooting', importance: 10 }
        ],
        important: [
          { title: 'Conduit Installation', importance: 7 },
          { title: 'Electrical Panel Work', importance: 7 },
          { title: 'Safety Compliance (OSHA)', importance: 7 }
        ],
        niceToHave: [
          { title: 'PLC/Automation', importance: 5 },
          { title: 'Solar Installation', importance: 5 },
          { title: 'Journeyman License', importance: 5 }
        ]
      },
      responsibilities: [
        'Install electrical wiring and fixtures',
        'Diagnose and repair electrical faults',
        'Read and interpret electrical blueprints',
        'Ensure code compliance on all installations',
        'Perform preventive maintenance'
      ],
      salaryRange: { min: 50000, max: 85000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // RETAIL (2)
    // ─────────────────────────────────────────────
    {
      title: 'Store Manager',
      category: 'Retail',
      experienceLevel: 'Mid Level',
      description: 'Oversee all retail store operations including sales performance, team management, and customer experience.',
      requiredSkills: {
        critical: [
          { title: 'Retail Operations', importance: 10 },
          { title: 'Team Leadership', importance: 10 },
          { title: 'Sales Performance Management', importance: 10 },
          { title: 'Inventory Control', importance: 10 }
        ],
        important: [
          { title: 'P&L Management', importance: 7 },
          { title: 'Customer Service', importance: 7 },
          { title: 'Hiring & Training Staff', importance: 7 }
        ],
        niceToHave: [
          { title: 'Loss Prevention', importance: 5 },
          { title: 'Visual Merchandising', importance: 5 },
          { title: 'POS Systems', importance: 5 }
        ]
      },
      responsibilities: [
        'Manage daily store operations',
        'Meet sales targets and KPIs',
        'Recruit, train, and schedule staff',
        'Manage inventory and product ordering',
        'Ensure excellent customer experience'
      ],
      salaryRange: { min: 45000, max: 70000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Visual Merchandiser',
      category: 'Retail',
      experienceLevel: 'Junior Level',
      description: 'Create visually compelling store displays and layouts that attract customers and drive product sales.',
      requiredSkills: {
        critical: [
          { title: 'Display Design', importance: 10 },
          { title: 'Planogram Implementation', importance: 10 },
          { title: 'Brand Standards', importance: 10 },
          { title: 'Product Styling', importance: 10 }
        ],
        important: [
          { title: 'Trend Awareness', importance: 7 },
          { title: 'Space Planning', importance: 7 },
          { title: 'Cross-functional Collaboration', importance: 7 }
        ],
        niceToHave: [
          { title: 'Adobe Creative Suite', importance: 5 },
          { title: 'Retail Analytics', importance: 5 },
          { title: 'Window Display Experience', importance: 5 }
        ]
      },
      responsibilities: [
        'Design and set up in-store displays',
        'Implement planograms and seasonal layouts',
        'Maintain brand visual standards',
        'Analyze sales impact of display changes',
        'Train store staff on visual standards'
      ],
      salaryRange: { min: 35000, max: 55000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // LEGAL (2)
    // ─────────────────────────────────────────────
    {
      title: 'Paralegal',
      category: 'Legal',
      experienceLevel: 'Mid Level',
      description: 'Support attorneys by conducting legal research, drafting documents, and managing case files.',
      requiredSkills: {
        critical: [
          { title: 'Legal Research (Westlaw/LexisNexis)', importance: 10 },
          { title: 'Legal Document Drafting', importance: 10 },
          { title: 'Case Management', importance: 10 },
          { title: 'Legal Terminology', importance: 10 }
        ],
        important: [
          { title: 'Court Filing Procedures', importance: 7 },
          { title: 'Client Communication', importance: 7 },
          { title: 'Document Review', importance: 7 }
        ],
        niceToHave: [
          { title: 'eDiscovery Tools', importance: 5 },
          { title: 'Billing Software (Clio)', importance: 5 },
          { title: 'Paralegal Certification (NALA)', importance: 5 }
        ]
      },
      responsibilities: [
        'Conduct legal research and summarize findings',
        'Draft pleadings, contracts, and correspondence',
        'Organize and manage case files',
        'Coordinate depositions and hearings',
        'Support attorneys during trial preparation'
      ],
      salaryRange: { min: 45000, max: 72000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Contract Administrator',
      category: 'Legal',
      experienceLevel: 'Mid Level',
      description: 'Manage the lifecycle of contracts, ensuring compliance, minimizing risk, and supporting negotiations.',
      requiredSkills: {
        critical: [
          { title: 'Contract Drafting & Review', importance: 10 },
          { title: 'Contract Lifecycle Management (CLM)', importance: 10 },
          { title: 'Legal Compliance', importance: 10 },
          { title: 'Risk Identification', importance: 10 }
        ],
        important: [
          { title: 'Negotiation Support', importance: 7 },
          { title: 'Vendor Management', importance: 7 },
          { title: 'Attention to Detail', importance: 7 }
        ],
        niceToHave: [
          { title: 'Procurement Knowledge', importance: 5 },
          { title: 'Salesforce/CLM Tools', importance: 5 },
          { title: 'Paralegal Background', importance: 5 }
        ]
      },
      responsibilities: [
        'Draft, review, and negotiate contracts',
        'Manage contract repository and renewals',
        'Ensure compliance with contract terms',
        'Identify and mitigate contractual risks',
        'Collaborate with legal, finance, and ops teams'
      ],
      salaryRange: { min: 55000, max: 88000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // TRANSPORTATION (2)
    // ─────────────────────────────────────────────
    {
      title: 'Logistics Coordinator',
      category: 'Transportation',
      experienceLevel: 'Mid Level',
      description: 'Coordinate the movement of goods by managing shipping, carriers, and supply chain operations.',
      requiredSkills: {
        critical: [
          { title: 'Freight Management', importance: 10 },
          { title: 'Supply Chain Coordination', importance: 10 },
          { title: 'TMS Software', importance: 10 },
          { title: 'Carrier Relations', importance: 10 }
        ],
        important: [
          { title: 'Import/Export Compliance', importance: 7 },
          { title: 'Inventory Management', importance: 7 },
          { title: 'Problem Solving', importance: 7 }
        ],
        niceToHave: [
          { title: 'Customs & Trade Regulations', importance: 5 },
          { title: 'Warehouse Management Systems', importance: 5 },
          { title: 'SAP/Oracle ERP', importance: 5 }
        ]
      },
      responsibilities: [
        'Schedule and track shipments',
        'Negotiate with carriers for rates',
        'Resolve delivery delays and issues',
        'Ensure compliance with trade regulations',
        'Coordinate with warehouses and vendors'
      ],
      salaryRange: { min: 42000, max: 68000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Truck Driver',
      category: 'Transportation',
      experienceLevel: 'Mid Level',
      description: 'Transport goods safely and on schedule over local, regional, or long-haul routes in compliance with regulations.',
      requiredSkills: {
        critical: [
          { title: 'CDL (Commercial Driver\'s License)', importance: 10 },
          { title: 'Safe Driving', importance: 10 },
          { title: 'Hours of Service (HOS) Compliance', importance: 10 },
          { title: 'Route Planning', importance: 10 }
        ],
        important: [
          { title: 'ELD (Electronic Logging Device)', importance: 7 },
          { title: 'Vehicle Pre-Trip Inspection', importance: 7 },
          { title: 'Cargo Securing', importance: 7 }
        ],
        niceToHave: [
          { title: 'Hazmat Endorsement', importance: 5 },
          { title: 'Flatbed/Tanker Experience', importance: 5 },
          { title: 'Customer Delivery Service', importance: 5 }
        ]
      },
      responsibilities: [
        'Operate commercial vehicles safely',
        'Conduct pre- and post-trip inspections',
        'Maintain accurate driving logs',
        'Communicate with dispatch',
        'Deliver goods on time and undamaged'
      ],
      salaryRange: { min: 45000, max: 75000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    // ─────────────────────────────────────────────
    // MANUFACTURING (2)
    // ─────────────────────────────────────────────
    {
      title: 'Quality Control Inspector',
      category: 'Manufacturing',
      experienceLevel: 'Mid Level',
      description: 'Inspect and test manufactured products to ensure they meet quality standards and specifications.',
      requiredSkills: {
        critical: [
          { title: 'Quality Inspection Techniques', importance: 10 },
          { title: 'Measurement Tools (Calipers/CMM)', importance: 10 },
          { title: 'Quality Standards (ISO 9001)', importance: 10 },
          { title: 'Defect Identification', importance: 10 }
        ],
        important: [
          { title: 'Statistical Process Control (SPC)', importance: 7 },
          { title: 'Documentation & Reporting', importance: 7 },
          { title: 'Non-Conformance Reporting', importance: 7 }
        ],
        niceToHave: [
          { title: 'Six Sigma / Lean', importance: 5 },
          { title: 'GD&T (Geometric Dimensioning)', importance: 5 },
          { title: 'Root Cause Analysis', importance: 5 }
        ]
      },
      responsibilities: [
        'Inspect products for defects and deviations',
        'Use precision measurement tools',
        'Document inspection results',
        'Identify and report non-conformances',
        'Collaborate with production to resolve quality issues'
      ],
      salaryRange: { min: 40000, max: 62000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    {
      title: 'Production Supervisor',
      category: 'Manufacturing',
      experienceLevel: 'Mid Level',
      description: 'Supervise manufacturing floor operations, managing production teams to meet output, safety, and quality targets.',
      requiredSkills: {
        critical: [
          { title: 'Production Planning', importance: 10 },
          { title: 'Team Supervision', importance: 10 },
          { title: 'Lean Manufacturing', importance: 10 },
          { title: 'Safety Compliance (OSHA)', importance: 10 }
        ],
        important: [
          { title: 'Performance Metrics (OEE, Throughput)', importance: 7 },
          { title: 'Problem Solving (PDCA/DMAIC)', importance: 7 },
          { title: 'Inventory & Materials', importance: 7 }
        ],
        niceToHave: [
          { title: 'Six Sigma Certification', importance: 5 },
          { title: 'ERP (SAP/Oracle)', importance: 5 },
          { title: 'Cross-training Programs', importance: 5 }
        ]
      },
      responsibilities: [
        'Oversee daily production operations',
        'Manage and motivate production teams',
        'Ensure production targets are met',
        'Enforce safety and quality standards',
        'Identify and implement process improvements'
      ],
      salaryRange: { min: 55000, max: 85000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // REAL ESTATE (1)
    // ─────────────────────────────────────────────
    {
      title: 'Real Estate Agent',
      category: 'Real Estate',
      experienceLevel: 'Mid Level',
      description: 'Assist clients in buying, selling, and renting properties by providing market expertise and managing transactions.',
      requiredSkills: {
        critical: [
          { title: 'Property Valuation', importance: 10 },
          { title: 'Sales & Negotiation', importance: 10 },
          { title: 'MLS & Real Estate Platforms', importance: 10 },
          { title: 'Client Relationship Management', importance: 10 }
        ],
        important: [
          { title: 'Contract & Transaction Management', importance: 7 },
          { title: 'Local Market Knowledge', importance: 7 },
          { title: 'Marketing Listings', importance: 7 }
        ],
        niceToHave: [
          { title: 'Real Estate License (Active)', importance: 5 },
          { title: 'Investment Properties', importance: 5 },
          { title: 'Property Management', importance: 5 }
        ]
      },
      responsibilities: [
        'Represent buyers and sellers in transactions',
        'Conduct property showings and open houses',
        'Prepare and negotiate purchase offers',
        'Guide clients through closing process',
        'Build and maintain referral network'
      ],
      salaryRange: { min: 40000, max: 100000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // NON-PROFIT (1)
    // ─────────────────────────────────────────────
    {
      title: 'Social Worker',
      category: 'Non-profit',
      experienceLevel: 'Mid Level',
      description: 'Support individuals, families, and communities in overcoming challenges and accessing social services.',
      requiredSkills: {
        critical: [
          { title: 'Case Management', importance: 10 },
          { title: 'Crisis Intervention', importance: 10 },
          { title: 'Community Resources Knowledge', importance: 10 },
          { title: 'Psychosocial Assessment', importance: 10 }
        ],
        important: [
          { title: 'Documentation & Reporting', importance: 7 },
          { title: 'Advocacy', importance: 7 },
          { title: 'Cultural Competency', importance: 7 }
        ],
        niceToHave: [
          { title: 'Trauma-Informed Care', importance: 5 },
          { title: 'LCSW/LMSW Licensure', importance: 5 },
          { title: 'Grant Writing', importance: 5 }
        ]
      },
      responsibilities: [
        'Assess client needs and develop care plans',
        'Connect clients to community resources',
        'Provide counseling and crisis support',
        'Maintain accurate case documentation',
        'Collaborate with multidisciplinary teams'
      ],
      salaryRange: { min: 42000, max: 65000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // MEDIA (2)
    // ─────────────────────────────────────────────
    {
      title: 'Content Writer',
      category: 'Media',
      experienceLevel: 'Mid Level',
      description: 'Research and produce written content for websites, blogs, social media, and marketing materials.',
      requiredSkills: {
        critical: [
          { title: 'Writing & Editing', importance: 10 },
          { title: 'SEO Writing', importance: 10 },
          { title: 'Research Skills', importance: 10 },
          { title: 'Content Strategy Basics', importance: 10 }
        ],
        important: [
          { title: 'CMS (WordPress)', importance: 7 },
          { title: 'Storytelling', importance: 7 },
          { title: 'Brand Voice Adaptation', importance: 7 }
        ],
        niceToHave: [
          { title: 'Long-form Content', importance: 5 },
          { title: 'Social Media Copywriting', importance: 5 },
          { title: 'Grammarly / Editing Tools', importance: 5 }
        ]
      },
      responsibilities: [
        'Write blog posts, articles, and web copy',
        'Research topics thoroughly before writing',
        'Optimize content for SEO',
        'Collaborate with marketing and design',
        'Revise content based on feedback'
      ],
      salaryRange: { min: 40000, max: 68000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    },
  
    {
      title: 'Video Editor',
      category: 'Media',
      experienceLevel: 'Mid Level',
      description: 'Assemble and edit raw footage into polished video productions for social media, marketing, and broadcast.',
      requiredSkills: {
        critical: [
          { title: 'Adobe Premiere Pro', importance: 10 },
          { title: 'Video Storytelling', importance: 10 },
          { title: 'Color Grading', importance: 10 },
          { title: 'Audio Mixing', importance: 10 }
        ],
        important: [
          { title: 'After Effects', importance: 7 },
          { title: 'Motion Graphics', importance: 7 },
          { title: 'File Management & Organization', importance: 7 }
        ],
        niceToHave: [
          { title: 'DaVinci Resolve', importance: 5 },
          { title: 'Short-form / Social Video', importance: 5 },
          { title: 'Script Supervision', importance: 5 }
        ]
      },
      responsibilities: [
        'Edit raw footage into final cut videos',
        'Apply color correction and grading',
        'Mix and synchronize audio tracks',
        'Add motion graphics and titles',
        'Deliver exports in required formats'
      ],
      salaryRange: { min: 45000, max: 80000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // AGRICULTURE (1)
    // ─────────────────────────────────────────────
    {
      title: 'Farm Manager',
      category: 'Agriculture',
      experienceLevel: 'Senior Level',
      description: 'Oversee all farm operations including crop/livestock management, labor supervision, and financial planning.',
      requiredSkills: {
        critical: [
          { title: 'Crop & Livestock Management', importance: 10 },
          { title: 'Farm Business Planning', importance: 10 },
          { title: 'Agricultural Equipment Operation', importance: 10 },
          { title: 'Soil & Pest Management', importance: 10 }
        ],
        important: [
          { title: 'Farm Record Keeping', importance: 7 },
          { title: 'Labor Management', importance: 7 },
          { title: 'Regulatory Compliance', importance: 7 }
        ],
        niceToHave: [
          { title: 'Precision Agriculture Technology', importance: 5 },
          { title: 'Irrigation Systems', importance: 5 },
          { title: 'Organic Certification', importance: 5 }
        ]
      },
      responsibilities: [
        'Plan and manage crop production schedules',
        'Oversee farm workers and contractors',
        'Manage farm budget and P&L',
        'Ensure compliance with agricultural regulations',
        'Implement sustainable farming practices'
      ],
      salaryRange: { min: 50000, max: 85000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // SCIENCE (1)
    // ─────────────────────────────────────────────
    {
      title: 'Research Scientist',
      category: 'Science',
      experienceLevel: 'Senior Level',
      description: 'Design and conduct scientific research experiments to generate new knowledge and solve complex problems.',
      requiredSkills: {
        critical: [
          { title: 'Experimental Design', importance: 10 },
          { title: 'Data Analysis & Statistics', importance: 10 },
          { title: 'Scientific Writing', importance: 10 },
          { title: 'Domain Expertise (Biology/Chemistry/Physics)', importance: 10 }
        ],
        important: [
          { title: 'Lab Techniques', importance: 7 },
          { title: 'Grant Writing', importance: 7 },
          { title: 'Python / R for Research', importance: 7 }
        ],
        niceToHave: [
          { title: 'Patent Filing', importance: 5 },
          { title: 'Cross-disciplinary Collaboration', importance: 5 },
          { title: 'Science Communication', importance: 5 }
        ]
      },
      responsibilities: [
        'Design and execute experiments',
        'Analyze and interpret research data',
        'Publish findings in peer-reviewed journals',
        'Apply for research grants and funding',
        'Mentor junior researchers and students'
      ],
      salaryRange: { min: 80000, max: 130000, currency: 'USD', period: 'yearly' },
      demandLevel: 'medium'
    },
  
    // ─────────────────────────────────────────────
    // PRODUCT MANAGEMENT (1)
    // ─────────────────────────────────────────────
    {
      title: 'Product Manager',
      category: 'Product Management',
      experienceLevel: 'Senior Level',
      description: 'Define product vision and strategy, prioritize features, and guide cross-functional teams to deliver user value.',
      requiredSkills: {
        critical: [
          { title: 'Product Strategy & Roadmapping', importance: 10 },
          { title: 'User Research & Discovery', importance: 10 },
          { title: 'Agile / Scrum', importance: 10 },
          { title: 'Stakeholder Management', importance: 10 }
        ],
        important: [
          { title: 'Data Analysis & Metrics', importance: 7 },
          { title: 'Competitive Analysis', importance: 7 },
          { title: 'Technical Literacy', importance: 7 }
        ],
        niceToHave: [
          { title: 'A/B Experimentation', importance: 5 },
          { title: 'Go-to-Market Strategy', importance: 5 },
          { title: 'SQL', importance: 5 }
        ]
      },
      responsibilities: [
        'Define and communicate product vision',
        'Prioritize product backlog and roadmap',
        'Collaborate with engineering, design, and business',
        'Analyze product metrics and user feedback',
        'Drive product launches and adoption'
      ],
      salaryRange: { min: 100000, max: 165000, currency: 'USD', period: 'yearly' },
      demandLevel: 'high'
    }
  
  ];
  
  export default jobRoles;