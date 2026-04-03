export type PlanVisibility = "private" | "link";

export type PlanRecord = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  city: string;
  planDate: string; // YYYY-MM-DD
  budget: number;
  vibe: string;
  visibility: PlanVisibility;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanEventRecord = {
  id: string;
  planId: string;
  eventSlug: string;
  note: string;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
};

export type VoteValue = 1 | -1;

export type VoteRecord = {
  id: string;
  planId: string;
  eventSlug: string;
  voterKey: string; // local fallback identity
  value: VoteValue;
  createdAt: string;
};

export type CommentRecord = {
  id: string;
  planId: string;
  authorKey: string;
  body: string;
  createdAt: string;
};

export type PlanAggregate = {
  plan: PlanRecord;
  events: PlanEventRecord[];
  votes: VoteRecord[];
  comments: CommentRecord[];
};
