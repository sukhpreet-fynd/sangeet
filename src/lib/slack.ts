const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL as string | undefined;

export async function notifySlack(text: string): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('VITE_SLACK_WEBHOOK_URL not set — skipping Slack notification');
    return;
  }
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
