const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';

export async function notifySlack(text: string): Promise<void> {
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'payload=' + encodeURIComponent(JSON.stringify({ text })),
    });
    if (!response.ok) {
      console.warn('Slack notification returned', response.status, await response.text());
    }
  } catch (error) {
    console.warn('Slack notification failed', error);
  }
}
