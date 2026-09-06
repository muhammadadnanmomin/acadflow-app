// ============================================================
// Confairo Chatbot — Mock Knowledge Base Data
// Used to seed the RAG vector store via /api/chatbot/seed-knowledge
// ============================================================

export const MOCK_CONFERENCES = [
  {
    id: "ICML2026",
    title: "International Conference on Machine Learning (ICML 2026)",
    location: "Vienna, Austria",
    country: "Austria",
    topics: ["machine learning", "deep learning", "AI", "neural networks"],
    submissionDeadline: "2026-02-01",
    notificationDate: "2026-04-15",
    conferenceDate: "2026-07-12",
    registrationFee: "$750",
    website: "https://icml.cc",
  },
  {
    id: "ICLR2026",
    title: "International Conference on Learning Representations (ICLR 2026)",
    location: "Singapore",
    country: "Singapore",
    topics: ["representation learning", "deep learning", "generative models"],
    submissionDeadline: "2026-10-01",
    notificationDate: "2027-01-20",
    conferenceDate: "2027-04-27",
    registrationFee: "$800",
    website: "https://iclr.cc",
  },
  {
    id: "CVPR2026",
    title: "IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR 2026)",
    location: "Seattle, USA",
    country: "USA",
    topics: ["computer vision", "image recognition", "object detection", "deep learning"],
    submissionDeadline: "2025-11-15",
    notificationDate: "2026-02-27",
    conferenceDate: "2026-06-10",
    registrationFee: "$900",
    website: "https://cvpr.thecvf.com",
  },
  {
    id: "NeurIPS2026",
    title: "Conference on Neural Information Processing Systems (NeurIPS 2026)",
    location: "Vancouver, Canada",
    country: "Canada",
    topics: ["neural networks", "statistics", "optimization", "reinforcement learning"],
    submissionDeadline: "2026-05-15",
    notificationDate: "2026-09-25",
    conferenceDate: "2026-12-07",
    registrationFee: "$700",
    website: "https://neurips.cc",
  },
  {
    id: "ACL2026",
    title: "Annual Meeting of the Association for Computational Linguistics (ACL 2026)",
    location: "Bangkok, Thailand",
    country: "Thailand",
    topics: ["natural language processing", "NLP", "computational linguistics", "LLM"],
    submissionDeadline: "2026-02-15",
    notificationDate: "2026-05-09",
    conferenceDate: "2026-08-02",
    registrationFee: "$600",
    website: "https://acl2026.org",
  },
  {
    id: "AAAI2026",
    title: "AAAI Conference on Artificial Intelligence (AAAI 2026)",
    location: "Philadelphia, USA",
    country: "USA",
    topics: ["artificial intelligence", "knowledge representation", "planning", "AI safety"],
    submissionDeadline: "2025-08-15",
    notificationDate: "2025-12-09",
    conferenceDate: "2026-02-25",
    registrationFee: "$850",
    website: "https://aaai.org/conference/aaai/aaai-26/",
  },
  {
    id: "ICDM2026",
    title: "IEEE International Conference on Data Mining (ICDM 2026)",
    location: "Mumbai, India",
    country: "India",
    topics: ["data mining", "knowledge discovery", "big data", "machine learning"],
    submissionDeadline: "2026-06-01",
    notificationDate: "2026-08-15",
    conferenceDate: "2026-11-10",
    registrationFee: "$500",
    website: "https://icdm2026.org",
  },
  {
    id: "SIGKDD2026",
    title: "ACM SIGKDD Conference on Knowledge Discovery and Data Mining (KDD 2026)",
    location: "Barcelona, Spain",
    country: "Spain",
    topics: ["data science", "data mining", "machine learning", "knowledge discovery"],
    submissionDeadline: "2026-02-01",
    notificationDate: "2026-05-01",
    conferenceDate: "2026-08-23",
    registrationFee: "$750",
    website: "https://kdd.org",
  },
  {
    id: "ICSE2026",
    title: "International Conference on Software Engineering (ICSE 2026)",
    location: "Toronto, Canada",
    country: "Canada",
    topics: ["software engineering", "software testing", "DevOps", "code analysis"],
    submissionDeadline: "2025-09-01",
    notificationDate: "2025-12-20",
    conferenceDate: "2026-04-12",
    registrationFee: "$950",
    website: "https://conf.researchr.org/home/icse-2026",
  },
  {
    id: "VLDB2026",
    title: "Very Large Data Bases Conference (VLDB 2026)",
    location: "Tokyo, Japan",
    country: "Japan",
    topics: ["databases", "data engineering", "distributed systems", "cloud"],
    submissionDeadline: "2026-03-01",
    notificationDate: "2026-06-01",
    conferenceDate: "2026-09-05",
    registrationFee: "$700",
    website: "https://vldb.org/2026",
  },
];

export const MOCK_FAQS = [
  {
    question: "How do I submit a paper to Confairo?",
    answer:
      "To submit a paper: 1) Log in and go to your Participant Dashboard, 2) Click 'Submit Paper', 3) Select the conference, 4) Fill in the title, abstract, and keywords, 5) Upload your PDF (max 15MB), 6) Add co-authors, 7) Click 'Submit'. You'll receive a confirmation email within minutes.",
  },
  {
    question: "What file formats are accepted for paper submission?",
    answer:
      "Confairo accepts PDF files only for paper submissions. The maximum file size is 15MB. Please ensure your paper follows the conference-specific formatting guidelines (usually IEEE or ACM format). Some conferences also accept supplementary materials as ZIP files.",
  },
  {
    question: "How can I check the status of my paper submission?",
    answer:
      "Go to Dashboard → Participant → My Submissions. You'll see a real-time status indicator: Submitted, Under Review, Decision Pending, Accepted, or Rejected. You'll also receive email notifications at each stage.",
  },
  {
    question: "What happens after my paper is accepted?",
    answer:
      "After acceptance: 1) You'll receive an acceptance email with camera-ready instructions, 2) Submit the final version by the camera-ready deadline, 3) Complete conference registration and pay the registration fee, 4) Your paper will be included in the conference proceedings, 5) Prepare a presentation (oral or poster based on assignment).",
  },
  {
    question: "How do I become a conference organizer on Confairo?",
    answer:
      "To create a conference: 1) Log in and go to Dashboard → Organizer, 2) Click 'Create Conference', 3) Fill in conference details (name, dates, topics, fees), 4) Set up the review workflow and deadlines, 5) Invite program committee members. The conference will be listed publicly once published.",
  },
  {
    question: "Can I withdraw my paper after submission?",
    answer:
      "Yes, you can withdraw your paper before the review process begins. Go to My Submissions, find your paper, and click 'Withdraw'. Once review has started, contact the conference organizer directly. After acceptance, withdrawal may affect your author standing.",
  },
  {
    question: "How does the peer review process work?",
    answer:
      "Confairo uses a double-blind review process by default. Reviewers are assigned by the program chairs and evaluate papers on originality, technical quality, clarity, and significance. Each paper typically receives 3 reviews. Authors can respond to reviews during the rebuttal period.",
  },
  {
    question: "What is the registration fee and how do I pay?",
    answer:
      "Registration fees vary by conference (set by the organizer) and attendee type (author, student, professional). Confairo supports secure payments via Razorpay (credit/debit cards, UPI, net banking). Go to Dashboard → Billing to manage payments and download invoices.",
  },
  {
    question: "How do I find upcoming conferences in my research area?",
    answer:
      "You can browse all conferences on the Conferences page (no login required). Use filters for: research topic/keywords, submission deadline, conference date, location/country, and conference type. You can also save conferences to track their deadlines.",
  },
  {
    question: "Can I edit my submission after submitting?",
    answer:
      "Yes, you can update your submission (title, abstract, authors, PDF) until the submission deadline. Go to My Submissions → Edit. After the deadline, no changes are allowed unless the organizer has enabled a revision period.",
  },
  {
    question: "How do I invite co-authors to my submission?",
    answer:
      "During paper submission (or by editing an existing submission), go to the 'Authors' section and add co-authors by their email address. They'll receive an invitation to claim the paper. All listed authors must have Confairo accounts for proceedings purposes.",
  },
  {
    question: "What is a camera-ready submission?",
    answer:
      "A camera-ready submission is the final, revised version of your accepted paper that will be published in the conference proceedings. It should incorporate reviewer feedback, follow the publisher's formatting guidelines strictly, and include author names (no anonymization). The camera-ready deadline is usually 2–4 weeks after acceptance notification.",
  },
];

export const MOCK_GUIDES = [
  {
    title: "Getting Started with Confairo",
    content:
      "Confairo is an academic conference management platform. To get started: Create an account at confairo.com, verify your email, complete your profile (name, affiliation, research interests), then navigate to your Dashboard to start discovering conferences or submitting papers.",
  },
  {
    title: "Organizer Quick Start Guide",
    content:
      "As an organizer, you can: Create and publish conferences, set up submission tracks and deadlines, invite program committee members and reviewers, manage the review process, send decisions, and export proceedings. Start from Dashboard → Organizer → Create Conference.",
  },
  {
    title: "Reviewer Guide",
    content:
      "When invited as a reviewer: Accept the invitation via email, go to Dashboard → Reviewer, view your assigned papers, submit reviews by the review deadline, and participate in the discussion phase. Use the Confairo review form with criteria scores and a written evaluation.",
  },
];

// Build the flat list of documents for seeding
export function buildKnowledgeDocuments() {
  const documents: Array<{
    content: string;
    metadata: {
      type: "faq" | "conference" | "guide" | "deadline";
      title?: string;
      source?: string;
      tags?: string[];
    };
  }> = [];

  // Conference documents
  for (const conf of MOCK_CONFERENCES) {
    documents.push({
      content: `Conference: ${conf.title}
Location: ${conf.location}
Topics: ${conf.topics.join(", ")}
Submission Deadline: ${conf.submissionDeadline}
Notification Date: ${conf.notificationDate}
Conference Date: ${conf.conferenceDate}
Registration Fee: ${conf.registrationFee}
Website: ${conf.website}`,
      metadata: {
        type: "conference",
        title: conf.title,
        source: conf.website,
        tags: conf.topics,
      },
    });
  }

  // FAQ documents
  for (const faq of MOCK_FAQS) {
    documents.push({
      content: `Q: ${faq.question}\nA: ${faq.answer}`,
      metadata: {
        type: "faq",
        title: faq.question,
        tags: ["faq", "help"],
      },
    });
  }

  // Guide documents
  for (const guide of MOCK_GUIDES) {
    documents.push({
      content: `Guide: ${guide.title}\n\n${guide.content}`,
      metadata: {
        type: "guide",
        title: guide.title,
        tags: ["guide", "documentation"],
      },
    });
  }

  return documents;
}
