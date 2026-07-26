import { NextResponse } from 'next/server';
import { PSICService } from '@/services/psicService';

/**
 * ============================================================================
 * SOCIAL LISTENING API ENDPOINT (PSIC UPGRADED)
 * ============================================================================
 * 
 * Menggabungkan interaksi dari 11 kanal komunikasi PSIC Omnichannel
 * dan mengembalikannya untuk kebutuhan Live Social Feed di Dasbor.
 */

export async function GET() {
  try {
    const [conversations, issues] = await Promise.all([
      PSICService.fetchConversations({ channelType: 'ALL' }),
      PSICService.fetchIssues(),
    ]);

    // Format mentions untuk backward compatibility dengan komponen SocialListeningFeed lama & baru
    const mentions = conversations.map((conv) => ({
      id: conv.id,
      platform: conv.channelType,
      author: conv.author.name || conv.author.username || 'Warga Garut',
      username: conv.author.username,
      avatarUrl: conv.author.avatarUrl,
      isVerified: conv.author.isVerified,
      isInfluencer: conv.author.isInfluencer,
      content: conv.title || 'Laporan Infrastruktur PUPR',
      sentiment: conv.sentiment.toLowerCase() as 'positive' | 'negative' | 'neutral',
      sentimentRaw: conv.sentiment,
      emotion: conv.emotion,
      topic: conv.smartLabel || conv.bidang || 'PUPR Garut',
      bidang: conv.bidang,
      intent: conv.intent,
      priority: conv.priority,
      status: conv.status,
      timestamp: conv.lastMessageAt,
      location: conv.location,
      likes: Math.floor(Math.random() * 50) + 5,
      retweets: Math.floor(Math.random() * 10) + 1,
    }));

    // Calculate trending topics dari smartLabel / bidang
    const topics = mentions.reduce((acc: Record<string, number>, mention) => {
      const topicName = mention.topic || 'PUPR Garut';
      acc[topicName] = (acc[topicName] || 0) + 1;
      return acc;
    }, {});

    const trendingTopics = Object.keys(topics)
      .map((topic) => ({
        name: topic,
        count: topics[topic],
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      mentions,
      trending: trendingTopics,
      issues,
      totalCount: mentions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Social Listening API Error:', error);
    return NextResponse.json(
      {
        error: 'Gagal memuat data Social Listening dari PSIC',
        mentions: [],
        trending: [],
      },
      { status: 500 }
    );
  }
}
