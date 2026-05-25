// ===== Database Types for eZForms =====
// These mirror the Supabase PostgreSQL schema

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
}

export interface Form {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  password: string | null;
  access_code: string | null;
  is_active: boolean;
  is_public_results: boolean;
  created_at: string;
}

export interface Participant {
  id: string;
  form_id: string;
  name: string;
}

export interface Question {
  id: string;
  form_id: string;
  question_text: string;
  sort_order: number;
  created_at: string;
}

export interface Response {
  id: string;
  form_id: string;
  responder_name: string;
  submitted_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  selected_participant_id: string;
}

// ===== Extended Types with Relations =====

export interface FormWithDetails extends Form {
  participants: Participant[];
  questions: Question[];
  _count?: {
    responses: number;
  };
}

export interface QuestionResult {
  question: Question;
  votes: {
    participant: Participant;
    count: number;
  }[];
  total_votes: number;
}

export interface FormResults {
  form: Form;
  questions: QuestionResult[];
  total_responses: number;
  participants: Participant[];
}

// ===== Form Builder Types =====

export interface FormBuilderData {
  title: string;
  description: string;
  participants: string[]; // just names during creation
  questions: string[];    // just text during creation
  password?: string;
  access_code?: string;
}

export type FormStep = 'details' | 'participants' | 'questions' | 'review';

// ===== Voting Types =====

export interface VotingState {
  formId: string;
  identity: string; // participant name selected
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> participantId
}
