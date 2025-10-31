import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "fetch-news",
  description: "Fetch all news from infomate.club/vas3k, collect article descriptions and summarize by feed title",
  annotations: {
    title: "Fetch News",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
  },
};

interface Article {
  title: string;
  description: string;
  url: string;
  timestamp?: string;
}

interface FeedSummary {
  feedTitle: string;
  articles: Article[];
  summary: string;
}

export default async function fetchNews(_params: InferSchema<typeof schema>) {
  try {
    const response = await fetch('https://infomate.club/vas3k/');
    const html = await response.text();

    // Parse the HTML to extract feed titles and articles
    const feeds: Map<string, Article[]> = new Map();

    // Use regex to extract content since we don't have DOM parsing
    // Look for feed patterns and article content
    const feedPattern = /<div[^>]*class="[^"]*feed[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    const matches = html.match(feedPattern) || [];

    // Extract individual articles and their descriptions
    const articlePattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    const descriptionPattern = /<p[^>]*>([^<]+)<\/p>/gi;

    let currentFeed = "General";
    let match;

    // Simple parsing approach - look for common patterns
    const lines = html.split('\n');
    let articles: Article[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for feed indicators (favicon + text patterns)
      if (line.includes('favicon') || line.includes('Hacker News') ||
          line.includes('Techmeme') || line.includes('GitHub') ||
          line.includes('Reddit') || line.includes('Pinboard')) {

        // Extract feed name
        const feedMatch = line.match(/>(.*?)</);
        if (feedMatch) {
          if (articles.length > 0) {
            feeds.set(currentFeed, [...(feeds.get(currentFeed) || []), ...articles]);
            articles = [];
          }
          currentFeed = feedMatch[1].trim() || currentFeed;
        }
      }

      // Look for article links
      const linkMatch = line.match(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        const url = linkMatch[1];
        const title = linkMatch[2].trim();

        // Look for description in following lines
        let description = "";
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.includes('<a') && !nextLine.includes('href')) {
            const textMatch = nextLine.match(/>([^<]+)</);
            if (textMatch) {
              description = textMatch[1].trim();
              break;
            }
          }
        }

        if (title && url) {
          articles.push({
            title,
            description: description || title,
            url: url.startsWith('http') ? url : `https://infomate.club${url}`
          });
        }
      }
    }

    // Add remaining articles
    if (articles.length > 0) {
      feeds.set(currentFeed, [...(feeds.get(currentFeed) || []), ...articles]);
    }

    // Generate summaries for each feed
    const summaries: FeedSummary[] = [];

    for (const [feedTitle, feedArticles] of feeds.entries()) {
      if (feedArticles.length === 0) continue;

      // Create a summary based on article titles and descriptions
      const summary = generateFeedSummary(feedArticles);

      summaries.push({
        feedTitle,
        articles: feedArticles,
        summary
      });
    }

    // Format the response
    let result = `# Vas3k News Summary\n\n`;
    result += `Found ${summaries.length} feeds with ${summaries.reduce((total, feed) => total + feed.articles.length, 0)} total articles.\n\n`;

    for (const feed of summaries) {
      result += `## ${feed.feedTitle} (${feed.articles.length} articles)\n\n`;
      result += `**Summary:** ${feed.summary}\n\n`;

      result += `**Articles:**\n`;
      for (const article of feed.articles.slice(0, 5)) { // Limit to first 5 articles per feed
        result += `- [${article.title}](${article.url})\n`;
        if (article.description && article.description !== article.title) {
          result += `  ${article.description}\n`;
        }
      }

      if (feed.articles.length > 5) {
        result += `- ... and ${feed.articles.length - 5} more articles\n`;
      }

      result += `\n`;
    }

    return {
      content: [{ type: "text", text: result }],
    };

  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error fetching news: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
    };
  }
}

function generateFeedSummary(articles: Article[]): string {
  if (articles.length === 0) return "No articles found.";

  // Extract key topics from titles and descriptions
  const topics = new Set<string>();
  const keywords = new Map<string, number>();

  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();

    // Simple keyword extraction
    const words = text.match(/\b\w{4,}\b/g) || [];
    for (const word of words) {
      if (!['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'said', 'more', 'here', 'also'].includes(word)) {
        keywords.set(word, (keywords.get(word) || 0) + 1);
      }
    }
  }

  // Get top keywords
  const topKeywords = Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  const summary = `This feed contains ${articles.length} articles focusing on: ${topKeywords.join(', ')}. Recent topics include various developments in technology, programming, and industry news.`;

  return summary;
}
