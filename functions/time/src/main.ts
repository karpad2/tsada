import { Client, Databases, Storage } from 'node-appwrite';

// Define your custom document interface
interface MyDocument {
  title_hu?: string;
  title_rs?: string;
  text_hu?: string;
  text_rs?: string;
  default_image?: string;
  // Add other fields as needed
}

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }: any) => {
  // Initialize the Appwrite Client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT ?? '')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID ?? '')
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const database = new Databases(client);
  const storage = new Storage(client);

  // Define your default image URL
  const defaultImageUrl = 'https://www.tsada.edu.rs/favicon.png';

  // Function to fetch content from Appwrite
  async function fetchContentFromAppwrite(id: string): Promise<MyDocument | null> {
    try {
      const response = await database.getDocument(
        process.env.APPWRITE_DATABASE_ID ?? '',
        process.env.APPWRITE_COLLECTION_ID ?? '',
        id
      );
      return response as MyDocument;
    } catch (err) {
      log("Error fetching content from Appwrite:", err);
      return null;
    }
  }

  // Function to fetch image URL from the bucket
  async function fetchImageUrl(imageId: string | undefined): Promise<string> {
    if (!imageId) {
      return defaultImageUrl; // Return default image if no image ID is provided
    }

    try {
      const file = await storage.getFile(process.env.APPWRITE_BUCKET_ID ?? '', imageId);
      const imageUrl = `${process.env.APPWRITE_FUNCTION_API_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${file.$id}/view?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;
      return imageUrl;
    } catch (err) {
      log("Error fetching image from bucket:", err);
      return defaultImageUrl; // Return default image if fetching fails
    }
  }

  // Extract the ID from the request path (assuming it's like "/:id")
  const id = req.path.split('/').pop();

  if (!id) {
    return res.send('Invalid request. No ID provided.');
  }

  // Handle specific routes like "/ping"
  if (req.path === '/ping') {
    return res.send('Pong');
  }

  // Fetch content based on the ID
  const content = await fetchContentFromAppwrite(id);

  if (!content) {
    return res.status(404).send('Content not found');
  }

  // Fetch the image URL from the bucket (or use default image if not found)
  const imageUrl = await fetchImageUrl(content.default_image);

  // Check user agent to determine if it's a bot or a browser
  const userAgent = req.headers['user-agent']?.toLowerCase();
  const isBot = userAgent?.includes('bot') || userAgent?.includes('crawler') || userAgent?.includes('spider') || userAgent?.includes('facebookexternalhit');

  if (isBot) {
    // Render HTML with structured data for bots (including Facebook's crawler)
    const html = `
      <html>
        <head>
          <meta property="og:title" content="${content.title_hu || content.title_rs}" />
          <meta property="og:description" content="${content.text_hu || content.text_rs}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:url" content="https://www.tsada.edu.rs/${id}" />
          <meta property="og:type" content="article" />
          <meta property="fb:app_id" content="885580820143317" />  <!-- Facebook App ID -->
          <title>${content.title_hu || content.title_rs}</title>
        </head>
        <body>
          <h1>${content.title_hu || content.title_rs}</h1>
          <p>${content.text_hu || content.text_rs}</p>
          <img src="${imageUrl}" alt="Image">
        </body>
      </html>
    `;
    return res.send(html, 200, { 'Content-Type': 'text/html' });
  } else {
    // Redirect normal browsers to the SPA page
    const redirectUrl = `https://www.tsada.edu.rs/renderer/news/${id}`;
    return res.send('', 301, { Location: redirectUrl });
  }
};
