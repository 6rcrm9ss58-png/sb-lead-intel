export interface CompanyInfo {
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: string;
  logo?: string;
  location?: string;
  founded?: number;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  snippet: string;
  date?: string;
}

export interface ResearchResult {
  company: CompanyInfo;
  news: NewsArticle[];
  socialProfiles: Record<string, string>;
  logo?: string;
}

interface TavilySearchResult {
  results?: Array<{
    url: string;
    title: string;
    content?: string;
    thumbnail?: string;
    publishedDate?: string;
  }>;
}

// Tavily API client for company research
class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Missing TAVILY_API_KEY environment variable');
    }
    this.apiKey = apiKey;
  }

  async search(query: string, options?: { maxResults?: number; includeRawContent?: boolean }): Promise<TavilySearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          max_results: options?.maxResults || 10,
          include_raw_content: options?.includeRawContent || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = await response.json() as TavilySearchResult;
      return data;
    } catch (error) {
      console.error('Tavily search error:', error);
      throw error;
    }
  }
}

// Initialize Tavily client
function getTavilyClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('Missing TAVILY_API_KEY environment variable');
  }
  return new TavilyClient(apiKey);
}

// Search for company information
export async function searchCompany(companyName: string): Promise<CompanyInfo> {
  try {
    const client = getTavilyClient();
    const results = await client.search(`${companyName} company information website`, {
      maxResults: 5,
    });

    if (!results.results || results.results.length === 0) {
      return {
        name: companyName,
      };
    }

    // Extract info from first result
    const topResult = results.results[0];
    return {
      name: companyName,
      website: topResult.url,
      description: topResult.content?.substring(0, 300),
      logo: topResult.thumbnail || undefined,
    };
  } catch (error) {
    console.error('Error searching company:', error);
    return {
      name: companyName,
    };
  }
}

// Search for recent news about company
export async function searchNews(companyName: string): Promise<NewsArticle[]> {
  try {
    const client = getTavilyClient();
    const results = await client.search(`${companyName} news recent`, {
      maxResults: 10,
    });

    if (!results.results) {
      return [];
    }

    return results.results.map((item) => ({
      title: item.title,
      url: item.url,
      source: new URL(item.url).hostname.replace('www.', ''),
      snippet: item.content?.substring(0, 200) || '',
      date: item.publishedDate || undefined,
    }));
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
}

// Get company logo from web
export async function getCompanyLogo(companyName: string, website?: string): Promise<string | null> {
  try {
    // Try favicon service first
    if (website) {
      try {
        const url = new URL(website);
        const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${url.hostname}`;
        // Verify favicon exists
        const response = await fetch(faviconUrl);
        if (response.ok) {
          return faviconUrl;
        }
      } catch {
        // Continue to next method
      }
    }

    // Try clearbit API if available
    const encodedName = encodeURIComponent(companyName);
    const clearbitUrl = `https://logo.clearbit.com/${encodedName}`;

    // Return the clearbit URL and let the client handle verification
    return clearbitUrl;
  } catch (error) {
    console.error('Error getting company logo:', error);
    return null;
  }
}

// Run full research pipeline
export async function runFullResearch(
  companyName: string,
  website?: string,
): Promise<ResearchResult> {
  try {
    const [companyInfo, newsArticles, logo] = await Promise.all([
      searchCompany(companyName),
      searchNews(companyName),
      getCompanyLogo(companyName, website),
    ]);

    // Update company info with website if found in search
    if (!companyInfo.website && website) {
      companyInfo.website = website;
    }

    return {
      company: companyInfo,
      news: newsArticles,
      socialProfiles: {
        // These would be extracted from the research results or additional API calls
      },
      logo: logo || undefined,
    };
  } catch (error) {
    console.error('Error running full research:', error);
    return {
      company: {
        name: companyName,
        website,
      },
      news: [],
      socialProfiles: {},
    };
  }
}

// Helper to format research for display
export function formatResearchSummary(result: ResearchResult): string {
  let summary = `Company: ${result.company.name}\n`;

  if (result.company.website) {
    summary += `Website: ${result.company.website}\n`;
  }

  if (result.company.description) {
    summary += `Description: ${result.company.description}\n`;
  }

  if (result.news.length > 0) {
    summary += `\nRecent News:\n`;
    result.news.slice(0, 3).forEach((article) => {
      summary += `- ${article.title}\n  Source: ${article.source}\n  URL: ${article.url}\n`;
    });
  }

  return summary;
}
