export interface Template {
  id: string;
  title: string;
  description: string;
  voting_type: "roster" | "general";
  questions: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: "dummy-squad",
    title: "Dummy Squad Template",
    description: "A placeholder template for squad voting (Roster).",
    voting_type: "roster",
    questions: [
      "Dummy Question 1 (Squad)?",
      "Dummy Question 2 (Squad)?",
      "Dummy Question 3 (Squad)?"
    ]
  },
  {
    id: "dummy-office",
    title: "Dummy Office Template",
    description: "A placeholder template for office voting (Roster).",
    voting_type: "roster",
    questions: [
      "Dummy Question 1 (Office)?",
      "Dummy Question 2 (Office)?",
      "Dummy Question 3 (Office)?"
    ]
  },
  {
    id: "dummy-open",
    title: "Dummy Open Vote",
    description: "A placeholder template for open voting (General).",
    voting_type: "general",
    questions: [
      "Dummy Question 1 (Open)?",
      "Dummy Question 2 (Open)?",
      "Dummy Question 3 (Open)?"
    ]
  }
];
