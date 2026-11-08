export type Platform = "fb" | "li";
export type Status = "todo" | "done";

export type Post = {
  id: string;
  user_id: string;
  text: string;
  platforms: Platform[];
  status: Status;
  created_at: string;
  posted_at: string | null;
  published: Partial<Record<Platform, string>>;
  theme: string | null;
  scheduled_for: string | null;
};

export type Profile = {
  id: string;
  name: string;
  weekly_goal: number;
  emoji: string;
};

export type Reaction = { id: string; post_id: string; user_id: string; emoji: string };
export type Comment = { id: string; post_id: string; user_id: string; text: string; created_at: string };
export type Idea = { id: string; user_id: string; text: string; created_at: string };
