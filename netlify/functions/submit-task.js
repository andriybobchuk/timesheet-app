import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function createNotionTask(title, description, tag) {
  const properties = {
    Name: {
      title: [{ text: { content: title } }],
    },
    Status: {
      status: { name: 'Today/Incoming' },
    },
    Tag: {
      multi_select: [{ name: tag }],
    },
  };

  const children = [];
  if (description) {
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: description } }],
      },
    });
  }

  return notion.pages.create({
    parent: { database_id: NOTION_DATABASE_ID },
    properties,
    children,
  });
}

async function sendTelegramNotification(title, tag) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const text = `New task [${tag}]:\n${title}`;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { title, description, tag } = JSON.parse(event.body);

    if (!title || !title.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Title is required' }) };
    }

    await createNotionTask(title, description || '', tag || 'Side Quest');

    // Fire-and-forget — don't let Telegram failures block the response
    sendTelegramNotification(title, tag || 'Side Quest').catch(console.error);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create task' }),
    };
  }
}
