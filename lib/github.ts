interface GitHubIssue {
  number: number;
  html_url: string;
}

export async function createGitHubIssue(
  repoUrl: string,
  title: string,
  description: string,
  priority: string,
  ticketId: string
): Promise<GitHubIssue | null> {
  try {
    // Parse GitHub repo URL to get owner and repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      console.error('Invalid GitHub repo URL:', repoUrl);
      return null;
    }

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, '');

    const body = `${description}\n\n---\n**Ticket ID:** ${ticketId}\n**Priority:** ${priority}`;

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error('GITHUB_TOKEN environment variable not set');
      return null;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          labels: [`priority:${priority}`, 'ticket'],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error:', response.status, error);
      return null;
    }

    const issue = await response.json();
    return {
      number: issue.number,
      html_url: issue.html_url,
    };
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    return null;
  }
}

export async function verifyGitHubWebhook(
  request: Request,
  secret: string
): Promise<boolean> {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) return false;

    const body = await request.text();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying GitHub webhook:', error);
    return false;
  }
}
