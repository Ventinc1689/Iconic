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

export const MOMENTS: Moment[] = [
  {
    id: '1',
    year: 1986,
    competition: 'FIFA World Cup',
    title: 'Hand of God',
    player: 'Diego Maradona',
    match: 'Argentina vs England — QF',
    caption:
      "With a sly punch disguised as a header, Maradona opened the scoring against England in the most controversial goal ever witnessed at a World Cup. The referee missed it; the world never forgot it. Seconds later he scored the century's greatest goal on the same pitch, turning one match into an eternal paradox of villainy and genius.",
    tags: ['Controversy', 'World Cup', 'Legend'],
    likes: 4821,
    emoji: '✋',
    color: 'bg-blue-900',
    tagColor: 'bg-blue-800 text-blue-200',
  },
  {
    id: '2',
    year: 1999,
    competition: 'UEFA Champions League',
    title: 'Fergie Time',
    player: 'Teddy Sheringham & Ole Gunnar Solskjær',
    match: 'Manchester United vs Bayern Munich — Final',
    caption:
      "Trailing 1–0 in stoppage time, Manchester United scored twice in 91 seconds to complete the most improbable comeback in Champions League final history. Solskjær's winning toe-poke prompted commentator Clive Tyldesley to simply say \"Name on the trophy.\" Ferguson wept on the touchline.",
    tags: ['Comeback', 'UCL Final', 'Stoppage Time'],
    likes: 3902,
    emoji: '⏱️',
    color: 'bg-red-900',
    tagColor: 'bg-red-800 text-red-200',
  },
  {
    id: '3',
    year: 2005,
    competition: 'UEFA Champions League',
    title: 'Istanbul Miracle',
    player: 'Steven Gerrard',
    match: 'Liverpool vs AC Milan — Final',
    caption:
      "Three goals down at half-time, Liverpool launched an extraordinary six-minute comeback — three goals in the second half and ultimately a penalty shootout victory. Gerrard's header sparked the revival. Dudek's wobbly-arm save in the shootout became its exclamation point. Football has never been the same on Merseyside.",
    tags: ['Comeback', 'UCL Final', 'Miracle'],
    likes: 5210,
    emoji: '🔴',
    color: 'bg-rose-950',
    tagColor: 'bg-rose-800 text-rose-200',
  },
  {
    id: '4',
    year: 2002,
    competition: 'FIFA World Cup',
    title: "Ronaldo's Redemption",
    player: 'Ronaldo Nazário',
    match: 'Brazil vs Germany — Final',
    caption:
      "After his mysterious illness before the 1998 final, Ronaldo returned to the World Cup stage and scored twice in the final against Germany to seal Brazil's fifth title. The tears, the haircut, the goals — it was closure written in gold. The world held its breath for four years; he delivered in 90 minutes.",
    tags: ['Redemption', 'World Cup Final', 'Brazil'],
    likes: 3455,
    emoji: '🇧🇷',
    color: 'bg-yellow-900',
    tagColor: 'bg-yellow-800 text-yellow-200',
  },
  {
    id: '5',
    year: 2012,
    competition: 'Premier League',
    title: 'Agüeroooo!',
    player: 'Sergio Agüero',
    match: 'Manchester City vs QPR — Final Day',
    caption:
      "In the 93rd minute of the final day, with Manchester City needing a goal to pip United to the title, Agüero controlled, turned, and fired into the net. Martin Tyler's scream became the sound of a city's identity being born. City had never won the Premier League. They won it in the most heart-stopping fashion possible.",
    tags: ['Title', 'Last Minute', 'Premier League'],
    likes: 6108,
    emoji: '💙',
    color: 'bg-sky-900',
    tagColor: 'bg-sky-800 text-sky-200',
  },
  {
    id: '6',
    year: 2014,
    competition: 'FIFA World Cup',
    title: "Götze's Golden Touch",
    player: 'Mario Götze',
    match: 'Germany vs Argentina — Final',
    caption:
      "In extra time, Schürrle crossed from the left. Götze controlled with his chest and, in a single fluid motion, volleyed the ball past Romero. Germany won the World Cup for the first time as a unified nation. Joachim Löw had said before the match: \"Do it for your country.\" Götze listened.",
    tags: ['World Cup Final', 'Extra Time', 'Germany'],
    likes: 2987,
    emoji: '🏆',
    color: 'bg-amber-900',
    tagColor: 'bg-amber-800 text-amber-200',
  },
];
