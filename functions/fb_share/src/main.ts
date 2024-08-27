import axios from 'axios';

export default async ({ req, res, log, error }: any) => {
  // Extract the URL to share and the full message from the request
  const { urlToShare, message, makePrivate } = req.body;  // Expecting the URL, message, and optional 'makePrivate' flag

  if (!urlToShare || !message) {
    return res.send('Missing URL or message to share.', 400);
  }

  // Fetch the Facebook Page Access Token from environment variables
  const pageAccessToken = process.env.page_access_token;

  if (!pageAccessToken) {
    return res.send('Facebook Page Access Token not found.', 500);
  }

  // Facebook Page ID
  const pageId = '1635520923342400';  // Your Facebook Page ID

  try {
    // Make a POST request to the Facebook Graph API to create a new post
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${pageId}/feed`,
      {
        message: message,  // Custom message from the request
        link: urlToShare,  // Link to share
        access_token: pageAccessToken,
        published: !makePrivate  // If 'makePrivate' is true, set published to false
      }
    );

    // Send a success response if the post is created
    return res.send({
      success: true,
      postId: response.data.id,
      message: 'Successfully shared the link on Facebook!',
      private: makePrivate ? true : false  // Indicate if the post was made private
    }, 200);
  } catch (err) {
    // Check if the error is an instance of Error
    if (err instanceof Error) {
      log('Error posting to Facebook:', err.message);

      // Handle errors with detailed message
      return res.send({
        success: false,
        error: `Failed to share the link on Facebook: ${err.message}`,
      }, 500);
    } else {
      // Handle unknown errors
      log('An unknown error occurred.');
      return res.send({
        success: false,
        error: 'An unknown error occurred while sharing the link on Facebook.',
      }, 500);
    }
  }
};
