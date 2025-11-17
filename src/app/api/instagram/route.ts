import { NextResponse } from 'next/server'

export async function GET() {
  // In a real application, you would fetch this from the Instagram API
  const placeholderPosts = [
    {
      id: '1',
      image: '/traveler-at-santorini-greece-blue-domes.jpg',
      caption: 'Santorini nunca decepciona! 🇬🇷✨',
      likes: 1243,
      permalink: 'https://instagram.com/donattiturismo'
    },
    {
      id: '2',
      image: '/couple-at-maldives-beach-sunset.jpg',
      caption: 'Maldivas: o paraíso é real! 🏝️',
      likes: 2105,
      permalink: 'https://instagram.com/donattiturismo'
    },
    {
      id: '3',
      image: '/person-at-machu-picchu-peru-mountains.jpg',
      caption: 'Machu Picchu tirou nosso fôlego 🏔️',
      likes: 1876,
      permalink: 'https://instagram.com/donattiturismo'
    },
    {
      id: '4',
      image: '/city-view-of-barcelona-sagrada-familia.jpg',
      caption: 'Barcelona e sua arquitetura única 🏛️',
      likes: 1532,
      permalink: 'https://instagram.com/donattiturismo'
    },
    {
      id: '5',
      image: '/safari-jeep-with-elephants-africa.jpg',
      caption: 'Safari na África: inesquecível! 🦁',
      likes: 1998,
      permalink: 'https://instagram.com/donattiturismo'
    }
  ];

  // Simulate a delay to show loading state
  await new Promise(resolve => setTimeout(resolve, 1500));

  return NextResponse.json({ posts: placeholderPosts })
}
