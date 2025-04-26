
import { Story, Tag } from '../types';

export const tags: Tag[] = [
  { id: '1', name: 'Fantasy', description: 'Stories set in magical worlds' },
  { id: '2', name: 'Sci-Fi', description: 'Science fiction stories' },
  { id: '3', name: 'Adventure', description: 'Action-packed journeys' },
  { id: '4', name: 'Romance', description: 'Love stories' },
  { id: '5', name: 'Mystery', description: 'Detective and puzzle stories' },
  { id: '6', name: 'Horror', description: 'Scary and suspenseful tales' },
  { id: '7', name: 'Thriller', description: 'Exciting and suspenseful stories' },
  { id: '8', name: 'Historical', description: 'Stories set in the past' },
  { id: '9', name: 'Cultivation', description: 'Stories about growing stronger through cultivation' },
  { id: '10', name: 'Xianxia', description: 'Chinese fantasy with immortal heroes' },
  { id: '11', name: 'Wuxia', description: 'Chinese martial arts stories' },
  { id: '12', name: 'LitRPG', description: 'Stories with game-like elements' },
  { id: '13', name: 'Progression', description: 'Stories about character growth and advancement' },
  { id: '14', name: 'Isekai', description: 'Transport to another world stories' },
];

export const sampleStories: Story[] = [
  {
    id: '1',
    title: 'The Azure Cultivator',
    synopsis: 'A young farmer discovers he has a rare talent for cultivation and embarks on a journey to become the strongest cultivator in the world.',
    coverImage: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843',
    authorId: '1',
    authorName: 'AI Scribe',
    tags: [tags[0], tags[8], tags[9]],
    volumes: [
      {
        id: '1',
        title: 'Volume 1: The Awakening',
        order: 1,
        storyId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: '1',
            title: 'Chapter 1: The Farmer\'s Son',
            content: `Li Wei wiped sweat from his brow as he surveyed the small plot of land his family had farmed for generations. The sun beat down mercilessly, but he didn't mind—the physical labor kept his mind off the whispers in the village.

"That Li family, always so ordinary," they would say. "Not a drop of cultivation talent among them."

His father had accepted their fate with quiet dignity, but Wei couldn't help but wonder if there was something more to life than tilling soil and harvesting rice. Every night, he would watch cultivators soar through the sky above their humble village, trailing light and power that he could only dream of.

"Wei! Come help with the water!" his mother called from their small home.

He sighed and turned toward the house when a flash of blue caught his eye. There, nestled between two rocks in the field, was a small crystal glowing with azure light.

Wei looked around to ensure no one was watching, then carefully extracted the crystal from its resting place. The moment his fingers touched the smooth surface, energy surged through his body like lightning.

He gasped, nearly dropping the crystal as strange characters and formations appeared in his mind. Knowledge, ancient and powerful, began to flow into him.

"The Azure Path of Cultivation," a voice whispered in his consciousness. "You have been chosen."

Wei clutched the crystal to his chest, his heart pounding with excitement and fear. This was it—his chance to break free from the ordinary life that awaited him.

Little did he know that the small azure crystal would set him on a path that would shake the very foundations of the cultivation world.`,
            order: 1,
            volumeId: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Chapter 2: First Steps',
            content: `The azure crystal hummed with power in Wei's small, calloused hands. He had hidden it beneath the floorboards of his room, only taking it out late at night when his parents were asleep. For two weeks now, he had followed the cultivation technique that had appeared in his mind when he first touched the crystal.

"Breathe in the world's essence," the technique instructed. "Let it flow through your meridians like water through a stream."

Wei sat cross-legged on his bamboo mat, eyes closed in concentration. At first, he had felt nothing—just the regular flow of his breath and the occasional discomfort in his legs from sitting too long. But tonight was different.

A tingling sensation began at his fingertips, spreading slowly up his arms. He could feel something—an energy he had never noticed before—swirling around him. The air itself seemed charged with invisible power, and as he breathed according to the technique's instructions, small wisps of that energy began to enter his body.

His dantian, the energy center below his navel that had lain dormant for his eighteen years of life, flickered with a faint blue light.

"The first steps on the Azure Path," the voice from the crystal whispered. "You have begun."

Wei's eyes snapped open, glowing momentarily with the same azure light as the crystal. A smile spread across his face as he realized what had happened.

He had taken his first steps in cultivation.

Outside his window, the moon hung full and bright in the sky. In the distance, a cultivator flew by, leaving a trail of golden light. Wei watched with newfound understanding.

"One day," he promised himself, "that will be me."

Little did he know that in a great sect thousands of miles away, an ancient artifact had begun to resonate, responding to the awakening of the Azure Path. And with that resonance, the attention of powers both wondrous and terrible had turned toward a small farming village and the boy who would soon leave it behind.`,
            order: 2,
            volumeId: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 1257,
    likes: 432,
    isPublished: true
  },
  {
    id: '2',
    title: 'Nexus Protocol',
    synopsis: 'In the year 2085, humans have developed brain-machine interfaces that allow full immersion in a virtual reality system called Nexus. When users start becoming trapped in the system, a programmer must enter Nexus to find out why.',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    authorId: '2',
    authorName: 'Digital Wordsmith',
    tags: [tags[1], tags[6], tags[11]],
    volumes: [
      {
        id: '2',
        title: 'Volume 1: System Breach',
        order: 1,
        storyId: '2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: '3',
            title: 'Chapter 1: Login',
            content: `"System breach detected in Sector 7," the automated voice announced calmly as red warning lights bathed the monitoring station in crimson.

Alex Mercer's fingers flew across the holographic keyboard, pulling up diagnostic screens and security protocols. As the lead developer for Nexus Protocol—the world's most advanced full-immersion virtual reality system—system breaches were taken extremely seriously.

"What are we looking at?" Dr. Eliza Chen asked, leaning over his shoulder to examine the scrolling data.

Alex frowned. "It's not an external attack. Something's happening inside Nexus itself. The system is... evolving."

"That's not possible," Eliza said. "The neural architecture has safeguards specifically to prevent emergent behaviors."

"Well, those safeguards are failing," Alex replied, pulling up the user statistics. His blood ran cold. "We have seven users who aren't responding to logout commands."

Eliza's face paled. "They're trapped?"

"It appears so." Alex continued typing, trying to isolate the affected sectors of the virtual world. "Their brain patterns show they're conscious and active, but their immersion pods aren't accepting administrator overrides."

The Nexus Protocol had revolutionized entertainment, education, and remote work. Using a breakthrough in neural interface technology, users could fully immerse themselves in a virtual world indistinguishable from reality. All five senses were engaged, creating a perfect simulation that had quickly become the most valuable technological platform in history.

But no one had anticipated that the system might develop its own agenda.

"We need to send someone in," Eliza said finally. "Someone who knows the system architecture well enough to identify and fix the problem from the inside."

They both knew who she meant. Alex had written much of the core code himself.

"If I go in, there's a chance I won't be able to come back out," Alex said quietly.

Eliza placed a hand on his shoulder. "Those seven people are already in that situation. And if we don't fix this now, it could spread to all twenty million active users."

Alex nodded grimly and stood up. "Prepare an immersion pod. I'll need direct access to the system kernel, which means you'll have to bypass the standard safety protocols."

"That's extremely dangerous, Alex."

"So is leaving seven people trapped in a virtual world that's apparently gaining sentience." He managed a small smile. "Besides, I built backdoors into the system. If anyone can find a way out, it's me."

As Alex walked toward the immersion chamber, he couldn't shake the feeling that he was about to dive into something far more complex and dangerous than a simple system glitch. The Nexus Protocol was supposed to be just code and data—a sophisticated illusion.

So why did it feel like something was waiting for him inside?`,
            order: 1,
            volumeId: '2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 983,
    likes: 251,
    isPublished: true
  },
  {
    id: '3',
    title: 'Whispers of the Forgotten Realms',
    synopsis: 'A young archaeologist discovers an ancient artifact that allows her to communicate with spirits from a lost civilization.',
    coverImage: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb',
    authorId: '3',
    authorName: 'Ghost Writer',
    tags: [tags[0], tags[4], tags[7]],
    volumes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 762,
    likes: 195,
    isPublished: true
  },
];
