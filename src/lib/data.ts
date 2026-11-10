import a0 from "@/assets/avatars/avatar-0.png";
import a1 from "@/assets/avatars/avatar-1.png";
import a2 from "@/assets/avatars/avatar-2.png";
import a3 from "@/assets/avatars/avatar-3.png";
import a4 from "@/assets/avatars/avatar-4.png";
import a5 from "@/assets/avatars/avatar-5.png";
import a6 from "@/assets/avatars/avatar-6.png";
import a7 from "@/assets/avatars/avatar-7.png";
import a8 from "@/assets/avatars/avatar-8.png";
import a9 from "@/assets/avatars/avatar-9.png";

export type Person = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bgColor: string;
  colorName: string;
  email: string;
  projects: string[];
  status: "active" | "away";
};

export const rolePastels: Record<string, { bg: string; name: string }> = {
  "Project Manager": { bg: "#F8E8C9", name: "Butter Yellow" },
  "Developer": { bg: "#DCE9F8", name: "Powder Blue" },
  "Backend Developer": { bg: "#DCE9F8", name: "Powder Blue" },
  "Team Lead": { bg: "#DCE9F8", name: "Powder Blue" },
  "UI/UX Designer": { bg: "#F5DFD0", name: "Peach" },
  "HR Manager": { bg: "#F3E7D2", name: "Warm Cream" },
  "QA Engineer": { bg: "#DDEDE1", name: "Sage Green" },
  "Incoming Employee": { bg: "#DDEDE1", name: "Sage Green" },
  "Outgoing Employee": { bg: "#F8DDE0", name: "Soft Rose" },
  "Administrator": { bg: "#E8E1F5", name: "Lavender" },
};

export const people: Person[] = [
  { id: "arjun", name: "Arjun Mehta", role: "Project Manager", avatar: a5, bgColor: "#F8E8C9", colorName: "Butter Yellow", email: "arjun@quickflow.io", projects: ["web", "pay"], status: "active" },
  { id: "rahul", name: "Rahul Sharma", role: "Developer", avatar: a0, bgColor: "#DCE9F8", colorName: "Powder Blue", email: "rahul@quickflow.io", projects: ["web", "ai"], status: "active" },
  { id: "meera", name: "Meera Nair", role: "UI/UX Designer", avatar: a2, bgColor: "#F5DFD0", colorName: "Peach", email: "meera@quickflow.io", projects: ["mobile", "web"], status: "active" },
  { id: "sana", name: "Sana Kapoor", role: "HR Manager", avatar: a8, bgColor: "#F3E7D2", colorName: "Warm Cream", email: "sana@quickflow.io", projects: [], status: "away" },
  { id: "david", name: "David Chen", role: "Team Lead", avatar: a4, bgColor: "#DCE9F8", colorName: "Powder Blue", email: "david@quickflow.io", projects: ["pay", "ai"], status: "active" },
  { id: "priya", name: "Priya Patel", role: "Incoming Employee", avatar: a6, bgColor: "#DDEDE1", colorName: "Sage Green", email: "priya@quickflow.io", projects: ["pay"], status: "active" },
  { id: "alex", name: "Alex Morgan", role: "Outgoing Employee", avatar: a1, bgColor: "#F8DDE0", colorName: "Soft Rose", email: "alex@quickflow.io", projects: ["pay", "mobile"], status: "away" },
  { id: "christy", name: "Christy Francis", role: "Administrator", avatar: a7, bgColor: "#E8E1F5", colorName: "Lavender", email: "christy@quickflow.io", projects: ["web", "pay", "mobile", "ai"], status: "active" },
  { id: "nina", name: "Nina Rossi", role: "QA Engineer", avatar: a3, bgColor: "#DDEDE1", colorName: "Sage Green", email: "nina@quickflow.io", projects: ["mobile"], status: "active" },
  { id: "kabir", name: "Kabir Rao", role: "Backend Developer", avatar: a9, bgColor: "#DCE9F8", colorName: "Powder Blue", email: "kabir@quickflow.io", projects: ["ai"], status: "active" },
];

export const currentUser = people.find((p) => p.id === "christy")!;
export const personById = (id: string) => people.find((p) => p.id === id)!;

export type Project = {
  id: string;
  name: string;
  progress: number;
  color: string;
  owner: string;
  due: string;
  members: string[];
  description: string;
  risk: "low" | "medium" | "high";
};

export const projects: Project[] = [
  { id: "web", name: "QuickFlow Website", progress: 85, color: "var(--chart-1)", owner: "arjun", due: "13 Nov", members: ["arjun", "rahul", "meera", "christy"], description: "Marketing site and customer portal rebuild.", risk: "low" },
  { id: "pay", name: "Payment Integration", progress: 65, color: "var(--chart-2)", owner: "david", due: "15 Nov", members: ["david", "alex", "priya", "arjun"], description: "Gateway, invoicing and refunds pipeline.", risk: "high" },
  { id: "mobile", name: "Mobile Application", progress: 45, color: "var(--chart-4)", owner: "meera", due: "18 Nov", members: ["meera", "nina", "alex"], description: "iOS and Android companion app.", risk: "medium" },
  { id: "ai", name: "AI Knowledge Engine", progress: 90, color: "var(--chart-3)", owner: "david", due: "22 Nov", members: ["david", "rahul", "kabir"], description: "Source ingestion, claim extraction and Q&A.", risk: "low" },
];

export type Handover = {
  id: string;
  projectId: string;
  project: string;
  date: string;
  month: string;
  from: string;
  to: string;
  time: string;
  status: "Pending approval" | "Changes requested" | "Approved" | "Rejected";
  knowledge: { question: string; answer: string }[];
};

export const handovers: Handover[] = [
  {
    id: "h1",
    projectId: "web",
    project: "Website Development",
    date: "13",
    month: "Nov",
    from: "rahul",
    to: "priya",
    time: "10:00 AM",
    status: "Pending approval",
    knowledge: [
      { question: "What is the primary focus of the website handover?", answer: "The marketing site and customer portal rebuild." },
      { question: "Who owns the website project?", answer: "Arjun Mehta is the project owner." },
    ],
  },
  {
    id: "h2",
    projectId: "pay",
    project: "Payment Integration",
    date: "15",
    month: "Nov",
    from: "alex",
    to: "priya",
    time: "2:30 PM",
    status: "Pending approval",
    knowledge: [
      { question: "Which systems are covered by the payment handover?", answer: "The payment gateway, invoicing, and refunds pipeline." },
      { question: "Who owns the Payment Integration project?", answer: "David Chen is the project owner." },
      { question: "Who is handing over Payment Integration to Priya?", answer: "Alex Morgan is the outgoing team member." },
    ],
  },
  {
    id: "h3",
    projectId: "mobile",
    project: "Mobile Application",
    date: "18",
    month: "Nov",
    from: "alex",
    to: "nina",
    time: "11:00 AM",
    status: "Pending approval",
    knowledge: [
      { question: "Which platforms are covered by the mobile handover?", answer: "The iOS and Android companion applications." },
      { question: "Who owns the Mobile Application project?", answer: "Meera Nair is the project owner." },
    ],
  },
];

export type Activity = { id: string; who: string; text: string; when: string };

export const activities: Activity[] = [
  { id: "a1", who: "rahul", text: "uploaded project documentation", when: "12 min ago" },
  { id: "a2", who: "priya", text: "approved a handover report", when: "1 hr ago" },
  { id: "a3", who: "alex", text: "completed knowledge verification", when: "3 hrs ago" },
  { id: "a4", who: "meera", text: "connected Figma as a knowledge source", when: "Yesterday" },
  { id: "a5", who: "david", text: "requested manager approval for Payment handover", when: "Yesterday" },
];

export const verification = [
  { who: "rahul", readiness: 90 },
  { who: "priya", readiness: 75 },
  { who: "alex", readiness: 55 },
];

export const notifications = [
  { id: "n1", text: "Payment module depends on a single developer.", tone: "danger" as const, when: "Just now" },
  { id: "n2", text: "Priya finished 12 of 16 verification questions.", tone: "accent" as const, when: "40 min ago" },
  { id: "n3", text: "Website handover scheduled for 13 Nov.", tone: "warning" as const, when: "2 hrs ago" },
];

export const sources = [
  { name: "GitHub", items: "412 commits · 38 PRs", status: "Synced" },
  { name: "Jira", items: "126 tickets", status: "Synced" },
  { name: "Confluence", items: "54 pages", status: "Synced" },
  { name: "Slack", items: "2,340 messages", status: "Analyzing" },
  { name: "Figma", items: "18 files", status: "Synced" },
  { name: "Google Drive", items: "73 documents", status: "Pending" },
];

export const verificationQuestions = [
  "Which service issues refunds when a payment fails after capture?",
  "Where are the payment gateway credentials rotated, and how often?",
  "Who must approve a change to the invoice numbering format?",
];

export const navItems = [
  { slug: "dashboard", label: "Dashboard" },
  { slug: "projects", label: "My Projects" },
  { slug: "team", label: "Team Members" },
  { slug: "sources", label: "Knowledge Sources" },
  { slug: "analysis", label: "AI Analysis" },
  { slug: "handovers", label: "Handover Reports" },
  { slug: "verification", label: "Knowledge Verification" },
  { slug: "readiness", label: "Readiness Reports" },
  { slug: "risk-radar", label: "Knowledge Risk Radar" },
  { slug: "timeline", label: "Continuity Timeline" },
  { slug: "activity", label: "Activity & History" },
  { slug: "settings", label: "Settings" },
] as const;
