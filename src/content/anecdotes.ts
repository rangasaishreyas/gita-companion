export interface CuratedAnecdote {
  verseId: string;
  kind: 'Story' | 'Context' | 'History' | 'Reflection';
  title: string;
  body: string;
  source: string;
}

/**
 * A small starter set of stories and context notes, retold in our own words.
 * Users add their own anecdotes on any verse; these are just a beginning.
 */
export const anecdotes: CuratedAnecdote[] = [
  {
    verseId: '1.1', kind: 'Story', title: 'Why Sanjaya tells the story',
    body: 'Before the war, the sage Vyasa offered the blind king Dhritarashtra the gift of sight so he could watch the battle. The king declined; he could not bear to see his family destroy itself. Vyasa instead gave the king\'s charioteer, Sanjaya, divine vision to see and hear everything on the field, even the private conversation between Krishna and Arjuna. So the whole Gita reaches us as a report given to a worried father, and his first question, "what did my sons do?", already shows the "mine and theirs" thinking the teaching goes on to take apart.',
    source: 'Mahabharata, Bhishma Parva',
  },
  {
    verseId: '1.47', kind: 'Reflection', title: 'Why despair is called a "yoga"',
    body: 'Chapter 1 ends with Arjuna dropping his bow and sitting down in grief, yet it is titled "Arjuna Vishada Yoga", the yoga of Arjuna\'s despair. Traditional teachers explain that honest sorrow is where real inquiry begins. Arjuna had to reach the end of his own answers before he could hear a deeper one. Compare this moment with 18.73, where the same man stands up again.',
    source: 'Traditional commentarial reading',
  },
  {
    verseId: '2.3', kind: 'History', title: 'Vivekananda\'s favourite verse',
    body: 'Swami Vivekananda often said that whoever takes this one verse to heart gets the benefit of the whole Gita: "Do not yield to unmanliness… cast off this petty weakness of heart and arise." He read it as a call to inner strength, and as a reminder that weakness dressed up as compassion is still weakness.',
    source: 'Lectures and letters of Swami Vivekananda',
  },
  {
    verseId: '2.7', kind: 'Context', title: 'From friend to student',
    body: 'Until this verse Krishna and Arjuna talk as cousins and friends, and Arjuna is still arguing. Here he admits he is confused and says "I am your disciple; teach me." The tradition treats this as the true start of the teaching: real instruction begins only when someone asks for it.',
    source: 'Shankaracharya and most classical commentators',
  },
  {
    verseId: '2.12', kind: 'History', title: 'Thoreau at Walden Pond',
    body: 'Henry David Thoreau kept a copy of the Gita at Walden. He wrote that in the morning he bathed his intellect "in the stupendous and cosmogonal philosophy of the Bhagvat Geeta", next to which, he felt, the modern world and its literature looked small. Emerson, his friend and mentor, owned one of the first English translations to reach America.',
    source: 'H. D. Thoreau, "Walden" (1854)',
  },
  {
    verseId: '2.20', kind: 'Context', title: 'An echo of Nachiketa',
    body: 'This verse, "never born, never dying…", closely follows a verse of the Katha Upanishad. There, the boy Nachiketa is sent to the house of Death and refuses every offer of wealth and pleasure until Yama teaches him what lies beyond death. The Gita takes that old Upanishadic teaching and gives it to a warrior standing in the middle of a battlefield.',
    source: 'Katha Upanishad 1.2.18–19',
  },
  {
    verseId: '2.47', kind: 'History', title: 'A commentary written in prison',
    body: 'Lokmanya Bal Gangadhar Tilak wrote his long study of the Gita, "Gita Rahasya", while held in Mandalay jail in Burma (1908–1914). Against readings that put renunciation first, he argued that the heart of the Gita is karma yoga: doing one\'s duty fully without attachment to the result. The pages he wrote there were later printed and widely read in the freedom movement.',
    source: 'B. G. Tilak, "Srimad Bhagavad Gita Rahasya" (1915)',
  },
  {
    verseId: '2.55', kind: 'History', title: 'Gandhi\'s daily verses',
    body: 'Mahatma Gandhi called the Gita his "mother" and his "eternal dictionary of reference". The verses describing the sthitaprajna, the person of steady wisdom (2.54–72), were recited at his ashram prayers every day. His own Gujarati rendering was titled "Anasakti Yoga", the yoga of non-attachment.',
    source: 'M. K. Gandhi, "Anasakti Yoga" and ashram prayer books',
  },
  {
    verseId: '2.62', kind: 'Reflection', title: 'The ladder down',
    body: 'Verses 62–63 describe how a person falls, step by step: thinking about an object → attachment → desire → anger → delusion → loss of memory → loss of discernment → ruin. It is worth tracing a recent bad reaction of your own back up this ladder. Most of us notice the anger and miss the first rung, the dwelling, where stepping off is easiest.',
    source: 'Reflection prompt',
  },
  {
    verseId: '3.35', kind: 'Context', title: 'Arjuna wanted to become a monk',
    body: 'Back in 2.5 Arjuna said it would be better to live on alms than to fight. Krishna\'s reply here, "better one\'s own dharma, even imperfectly done, than another\'s done well", speaks to that wish. Taking up a holier-looking path to escape a hard duty can still be a kind of running away. Commentators note that the same Arjuna is praised elsewhere in the epic as an archer, not as an ascetic.',
    source: 'Mahabharata context; Ramanuja and Shankara on 3.35',
  },
  {
    verseId: '4.4', kind: 'Context', title: '"But you were born after the Sun!"',
    body: 'Krishna has just said he first taught this yoga to Vivasvan, the Sun, who taught Manu, who taught King Ikshvaku. Arjuna objects sensibly: you were born recently, how could you have taught the Sun? The puzzle opens one of the Gita\'s central passages, on the divine taking birth again and again (4.5–8).',
    source: 'Bhagavad Gita 4.1–8',
  },
  {
    verseId: '4.7', kind: 'Context', title: 'The avatara verse',
    body: 'Together with 4.8, this is one of the most quoted verses in Hindu worship: whenever dharma declines, the divine comes forth to protect the good and restore order. Later Puranic tradition lists the familiar ten avataras, from Matsya the fish to Kalki who is still to come, but the Gita itself gives no fixed list. It makes a promise rather than writing a timetable.',
    source: 'Bhagavad Gita 4.7–8; Puranic dashavatara lists',
  },
  {
    verseId: '6.5', kind: 'Reflection', title: 'Your own best friend',
    body: '"Lift yourself by yourself; do not let yourself sink. The self alone is the friend of the self, and the self alone is its enemy." Before reading on, try a simple experiment: this week, notice one moment when your mind acted as your friend and one when it acted as your enemy. What was different about the two moments?',
    source: 'Reflection prompt',
  },
  {
    verseId: '6.35', kind: 'Context', title: 'Practice and dispassion',
    body: 'Arjuna complains that the mind is as hard to hold as the wind. Krishna does not argue; he agrees and then gives a method: abhyasa (steady practice) and vairagya (dispassion). Patanjali\'s Yoga Sutra (1.12) names exactly the same pair as the way to still the mind. The two classic texts meet here.',
    source: 'Yoga Sutra of Patanjali 1.12',
  },
  {
    verseId: '9.22', kind: 'Story', title: 'The scholar who corrected Krishna',
    body: 'A well-loved folk tale tells of a poor scholar, often called Arjuna Mishra, who doubted the word "vahami" ("I myself carry") in this verse. Surely God does not carry anything personally, he thought, and he struck it out. That day, a dark young boy came to his wife carrying heavy provisions, his back marked with fresh scratches. When the scholar came home and heard the story, he understood whose back he had scratched with his pen. The phrase "yogakshemam vahamyaham" is also the motto of the Life Insurance Corporation of India.',
    source: 'Popular devotional tale (folk tradition); LIC of India motto',
  },
  {
    verseId: '9.26', kind: 'Story', title: 'Vidura\'s simple meal',
    body: 'When Krishna went to Hastinapura as a peace envoy, Duryodhana prepared a royal feast for him. Krishna turned it down and ate a plain meal at the house of Vidura, a humble and devoted man. Later tradition adds Sudama, the poor childhood friend who could bring only a handful of beaten rice, which Krishna ate with delight. "A leaf, a flower, a fruit, or water offered with love, I accept."',
    source: 'Mahabharata, Udyoga Parva; Bhagavata Purana (Sudama)',
  },
  {
    verseId: '11.8', kind: 'Context', title: 'Seeing needs a new eye',
    body: 'Arjuna asks to see the cosmic form, and Krishna says: you cannot see me with these eyes, so I give you a divine eye. Many readers see a teaching about knowledge in this: some truths cannot be grasped just by trying harder with the tools we already have. In the epic, Krishna had already shown a glimpse of this form in the Kaurava court, when Duryodhana tried to take him prisoner.',
    source: 'Bhagavad Gita 11.8; Mahabharata, Udyoga Parva',
  },
  {
    verseId: '11.32', kind: 'History', title: 'Oppenheimer and the Trinity test',
    body: 'J. Robert Oppenheimer, who had read the Gita in Sanskrit while at Berkeley, later said that after the first atomic test in July 1945 this verse came to his mind: "Now I am become Death, the destroyer of worlds." He also linked the blast to 11.12, "the radiance of a thousand suns". His translation of kala as "death" differs from the usual "time", but the image of time as the great destroyer is the same.',
    source: 'Oppenheimer, NBC documentary interview (1965)',
  },
  {
    verseId: '12.13', kind: 'Reflection', title: 'A portrait, not a rulebook',
    body: 'Verses 12.13–20 draw a portrait of the person dear to the divine: without hatred, friendly and compassionate, steady in pleasure and pain. Instead of reading these as rules to obey, try reading them as a description to grow into. Pick one quality and watch for it, in yourself and in others, for a week.',
    source: 'Reflection prompt',
  },
  {
    verseId: '15.1', kind: 'Context', title: 'The upside-down tree',
    body: 'The ashvattha (sacred fig) with its roots above and branches below is an image the Gita takes from the Katha Upanishad (2.3.1). The roots in the highest reality are hidden; what we see are the spreading branches of the world, fed by the gunas. Verse 15.3 then gives the instruction: cut it down with the strong axe of non-attachment.',
    source: 'Katha Upanishad 2.3.1',
  },
  {
    verseId: '16.21', kind: 'Reflection', title: 'Three gates',
    body: 'Desire, anger and greed are called three gates to self-destruction. In the Mahabharata, Duryodhana walks through all three: he wants the kingdom, he is enraged by the Pandavas\' success, and he refuses to give up even five villages for peace. The verse invites a quieter question: which of these gates is closest to my own door?',
    source: 'Mahabharata, Udyoga Parva (five villages)',
  },
  {
    verseId: '17.20', kind: 'Story', title: 'Karna\'s armour',
    body: 'Karna was born wearing divine armour and earrings that made him almost invincible. Indra, wanting to protect his son Arjuna, came to Karna disguised as a brahmin and asked for them as alms. Karna had been warned, but he cut them off and gave them anyway, because he had vowed never to refuse anyone who asked. Readers have long discussed what kind of giving this was. The Gita\'s threefold test of dana (17.20–22) is a good place to start: what is given, to whom, when, and in what spirit?',
    source: 'Mahabharata, Vana Parva',
  },
  {
    verseId: '18.66', kind: 'Context', title: 'The "final verse"',
    body: 'In the Sri Vaishnava tradition of Ramanuja, this verse is called the charama shloka, the final or supreme verse. It is one of three core mantras every follower studies, and is understood as the Lord\'s own promise of refuge (sharanagati). Advaita commentators read the same words as a call to give up the sense of being the doer and rest in knowledge. The verse carries both readings.',
    source: 'Sri Vaishnava rahasya-traya teaching; Shankara on 18.66',
  },
  {
    verseId: '18.73', kind: 'Reflection', title: 'He stands up again',
    body: 'At 1.47 Arjuna sat down and let his bow fall. Here he says: "My delusion is gone; I have regained my memory by your grace; I stand firm, free of doubt; I will do as you say." The outer situation has not changed at all; the same armies still face each other. What has changed is the person seeing it.',
    source: 'Bhagavad Gita 1.47 and 18.73',
  },
  {
    verseId: '18.78', kind: 'Context', title: 'Sanjaya has the last word',
    body: 'The Gita ends with Sanjaya, the narrator, speaking to the blind king again: wherever Krishna, the lord of yoga, and Arjuna, the archer, are together, there will be fortune, victory, prosperity and sound conduct. It is a quiet answer to Dhritarashtra\'s worried question in 1.1, and many people read it as a blessing on anyone who joins insight with effort.',
    source: 'Bhagavad Gita 1.1 and 18.78',
  },
];

export const anecdotesFor = (verseId: string) => anecdotes.filter((a) => a.verseId === verseId);
