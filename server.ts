import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase body parser limits to handle base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const BASE_URL = process.env.BASE_URL || "https://apihub.agnes-ai.com/v1";
const API_KEY = process.env.API_KEY || "sk-ks4duOMwKB5dttQYf4bvT8bLXwAmtHeYmERoYkVBd9bwtZT3";
const MODEL = process.env.MODEL || "agnes-2.0-flash";

/**
 * Helper to fetch a web page and clean its HTML to retrieve main body text
 */
async function scrapeWebpage(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract title using Regex
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "Webpage";

    // Clean HTML to extract readable text
    let text = html;
    
    // Strip script, style, head, noscript, and iframe blocks
    text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
    text = text.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "");
    
    // Strip all HTML tags
    text = text.replace(/<[^>]+>/g, " ");
    
    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, " ")
               .replace(/&amp;/g, "&")
               .replace(/&lt;/g, "<")
               .replace(/&gt;/g, ">")
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&apos;/g, "'");
               
    // Condense multiple whitespaces/newlines
    text = text.replace(/\s+/g, " ").trim();

    // Truncate to a reasonable character limit to prevent token limits (8000 characters)
    const maxLength = 8000;
    const truncated = text.length > maxLength ? text.slice(0, maxLength) + "... [Content Truncated for Analysis]" : text;

    return { title, content: truncated };
  } catch (error: any) {
    console.error("Webpage scraping failed:", error.message);
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}

// REST API endpoint for media analysis
app.post("/api/analyze", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // Reload environment variables dynamically to pick up any runtime changes to .env file
    dotenv.config({ override: true });

    const { type, payload, prompt } = req.body;

    if (!type || !payload) {
      res.status(400).json({ error: "Missing required fields: 'type' (image | web_link) and 'payload'" });
      return;
    }

    const currentBaseUrl = process.env.BASE_URL || BASE_URL;
    const currentApiKey = process.env.API_KEY || API_KEY;
    const currentModel = process.env.MODEL || MODEL;

    if (!currentApiKey) {
      res.status(500).json({ error: "API Key is not configured. Please add API_KEY to .env" });
      return;
    }

    let messages: any[] = [];
    let scraperResult: { title: string; content: string } | null = null;

    if (type === "image") {
      // Image analysis payload (base64 or direct URL)
      const userPrompt = prompt || "Please analyze this image, recognize all visible elements, text, objects, and explain the overall layout, context, and details in depth.";
      
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: payload // Expected to be "data:image/png;base64,..." or a public image URL
              }
            }
          ]
        }
      ];
    } else if (type === "web_link") {
      let isFallbackScraping = false;
      // Web link analysis - we scrape it first to ensure accurate text retrieval
      try {
        scraperResult = await scrapeWebpage(payload);
      } catch (scrapingErr: any) {
        console.warn(`Webpage scraping failed: ${scrapingErr.message}. Falling back to domain/metadata-only analysis...`);
        isFallbackScraping = true;
        
        let parsedTitle = "Webpage";
        try {
          const urlObj = new URL(payload);
          parsedTitle = urlObj.hostname.replace("www.", "") || "Webpage";
        } catch(_) {}
        
        scraperResult = {
          title: `${parsedTitle} (网络代理分析)`,
          content: `[注意: 由于沙箱网络隔离，无法抓取该网页的实时正文。以下是目标网址: ${payload}]`
        };
      }

      const userPrompt = prompt || "Please analyze the following scraped webpage content. Provide a structured summary, outline its main topics, describe the purpose, list key highlights, and analyze its primary messages.";

      const finalPromptText = isFallbackScraping 
        ? `${userPrompt}\n\n【说明：由于服务器隔离限制，未能实时获取网页正文，请结合此网址、域名（${payload}）和您的知识库对其可能的主旨、背景和业务进行深入分析，并在报告开头友好地提及此点。】`
        : `${userPrompt}\n\nWebpage Title: ${scraperResult.title}\nWebpage Source URL: ${payload}\n\nWebpage Content Text:\n"""\n${scraperResult.content}\n"""`;

      messages = [
        {
          role: "user",
          content: finalPromptText
        }
      ];
    } else {
      res.status(400).json({ error: "Unsupported media type. Supported types: 'image', 'web_link'." });
      return;
    }

    // Call the custom API completions endpoint
    const apiEndpoint = `${currentBaseUrl}/chat/completions`;
    console.log(`Forwarding request to ${apiEndpoint} using model ${currentModel}`);

    const apiResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentApiKey}`
      },
      body: JSON.stringify({
        model: currentModel,
        messages: messages,
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Upstream API error (${apiResponse.status}):`, errorText);
      res.status(apiResponse.status).json({
        error: `Custom API returned error status ${apiResponse.status}`,
        details: errorText
      });
      return;
    }

    const data = await apiResponse.json();
    const resultText = data.choices?.[0]?.message?.content || "No analysis generated.";

    res.json({
      success: true,
      result: resultText,
      meta: scraperResult ? { title: scraperResult.title } : null,
      model: currentModel
    });

  } catch (error: any) {
    console.error("Analysis handler exception:", error);
    res.status(500).json({ error: "Internal Server Error during media analysis", details: error.message });
  }
});

// Integration with Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dev environment: mount Vite dev server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production environment: serve static production bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Media Workspace Running on http://localhost:${PORT}`);
  });
}

startServer();
