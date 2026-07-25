import { NextResponse } from 'next/server';

const MOCK_MENTIONS = [
  {
    id: 1,
    platform: 'twitter',
    author: '@wargagarut',
    content: 'Jalan di daerah Samarang sudah mulai berlubang lagi, tolong @puprgarut segera dicek. Bahaya kalau malam hari.',
    sentiment: 'negative',
    topic: 'Jalan Garut',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    likes: 12,
    retweets: 4
  },
  {
    id: 2,
    platform: 'instagram',
    author: 'GarutUpdate',
    content: 'Apresiasi untuk Dinas PUPR Kabupaten Garut yang merespon cepat perbaikan gorong-gorong di Tarogong. Mantap! ðŸ‘ #DinasPUPRGarut',
    sentiment: 'positive',
    topic: 'Dinas PUPR Garut',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    likes: 345,
    retweets: 12
  },
  {
    id: 3,
    platform: 'facebook',
    author: 'Info Garut',
    content: 'Bagi warga yang mau mengurus PBG Garut sekarang bisa online lewat SIMBG lho. Lebih cepat dan transparan.',
    sentiment: 'positive',
    topic: 'PBG Garut',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likes: 89,
    retweets: 23
  },
  {
    id: 4,
    platform: 'twitter',
    author: '@aslisunda',
    content: 'Kenapa ya ngurus PBG di Garut agak lama? Apa karena sistem baru? Mohon pencerahannya min @puprgarut',
    sentiment: 'neutral',
    topic: 'PBG Garut',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    likes: 3,
    retweets: 1
  },
  {
    id: 5,
    platform: 'instagram',
    author: 'ridwankamil_fans',
    content: 'Semoga infrastruktur jalan garut ke depannya makin mulus dan terawat. Ayo Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut!',
    sentiment: 'positive',
    topic: 'Jalan Garut',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likes: 56,
    retweets: 0
  },
  {
    id: 6,
    platform: 'twitter',
    author: '@pemudagarut',
    content: 'Banjir cileuncang di jalan pembangunan belum ada perbaikan nih. Gimana nih kinerjanya Dinas PUPR Garut?',
    sentiment: 'negative',
    topic: 'Dinas PUPR Garut',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    likes: 45,
    retweets: 15
  }
];

const NEW_MOCK_MENTIONS = [
  {
    platform: 'twitter',
    author: '@asep_sopian',
    content: 'Lagi ngurus PBG Garut, alhamdulillah dibantu petugasnya ramah-ramah.',
    sentiment: 'positive',
    topic: 'PBG Garut'
  },
  {
    platform: 'facebook',
    author: 'Suara Rakyat Garut',
    content: 'Warga mengeluhkan debu dari proyek perbaikan jalan di Leles. Mohon Dinas PUPR Garut segera melakukan penyiraman rutin.',
    sentiment: 'negative',
    topic: 'Jalan Garut'
  },
  {
    platform: 'instagram',
    author: 'garut.banget',
    content: 'Inovasi pelayanan Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut patut diacungi jempol. #GarutHebat',
    sentiment: 'positive',
    topic: 'Dinas PUPR Garut'
  },
  {
    platform: 'twitter',
    author: '@kakang_prabu',
    content: 'Jalan ke arah kawah darajat mantap banget sekarang, mulus! Hatur nuhun @puprgarut',
    sentiment: 'positive',
    topic: 'Jalan Garut'
  }
];

let currentId = 7;
let activeMentions = [...MOCK_MENTIONS];

export async function GET() {
  // Simulate real-time by randomly adding a new mention every few requests
  if (Math.random() > 0.6) {
    const randomMention = NEW_MOCK_MENTIONS[Math.floor(Math.random() * NEW_MOCK_MENTIONS.length)];
    activeMentions.unshift({
      id: currentId++,
      platform: randomMention.platform,
      author: randomMention.author,
      content: randomMention.content,
      sentiment: randomMention.sentiment,
      topic: randomMention.topic,
      timestamp: new Date().toISOString(),
      likes: Math.floor(Math.random() * 50),
      retweets: Math.floor(Math.random() * 10)
    });
    
    // Keep only top 20
    if (activeMentions.length > 20) {
      activeMentions.pop();
    }
  }

  // Calculate trending topics
  const topics = activeMentions.reduce((acc: Record<string, number>, mention) => {
    acc[mention.topic] = (acc[mention.topic] || 0) + 1;
    return acc;
  }, {});

  const trendingTopics = Object.keys(topics).map(topic => ({
    name: topic,
    count: topics[topic]
  })).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    mentions: activeMentions,
    trending: trendingTopics
  });
}
