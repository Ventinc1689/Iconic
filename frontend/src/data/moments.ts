export interface Moment {
  id: string;
  year: number;
  competition: string;
  title: string;
  player: string;
  match: string;
  caption: string;
  tags: string[];
  likes: number;
  emoji: string;
  color: string; // tailwind bg color class for placeholder
  tagColor: string; // tailwind text/bg for tags
}
