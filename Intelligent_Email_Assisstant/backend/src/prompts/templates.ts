export interface PromptParams {
  threadText?: string;
  subject?: string;
  from?: string;
  to?: string;
  tone?: 'Professional' | 'Friendly' | 'Formal' | 'Concise';
  format?: 'bullets' | 'paragraph' | 'concise';
  instructions?: string;
}

export const PROMPTS = {
  summarize: (params: PromptParams) => `
You are an expert executive email assistant. Summarize the following email thread accurately, concisely, and with actionable clarity.

Email Subject: ${params.subject || 'N/A'}
Thread Content:
${params.threadText}

Format instructions:
- Provide a high-level 2-3 sentence overview.
- Extract 3-5 bulleted key points highlighting who said what, decisions made, and pending questions.
- Note the sender's tone/sentiment (e.g. urgent, collaborative, inquiry, appreciative).
- Clearly state if there are any immediate blockers or deadlines.

Return your response in clean, readable markdown format.
`,

  generateReply: (params: PromptParams) => `
You are an intelligent email copilot. Draft a context-aware email reply based on the following conversation history.

Selected Tone: ${params.tone || 'Professional'}
Additional User Instructions: ${params.instructions ? params.instructions : 'Draft an appropriate, polite response addressing all open items.'}

Thread Content:
${params.threadText}

Guidelines for the reply:
- Match the requested tone: ${params.tone || 'Professional'} (e.g. Friendly is warm and conversational; Formal is polished and respectful; Concise is brief and direct; Professional is balanced and business-ready).
- Follow any specific user instructions accurately.
- Address all questions or requests made in the last email of the thread.
- Do NOT include placeholder tags like [Your Name] if you can avoid it; write a ready-to-send draft.
- Provide ONLY the email body text without introductory or concluding conversational chat from you.
`,

  explain: (params: PromptParams) => `
You are a plain-English email translator. Break down the following email thread for a user who needs a clear, jargon-free explanation.

Email Subject: ${params.subject || 'N/A'}
Thread Content:
${params.threadText}

Provide:
1. **Plain Language Summary**: What is this email really about in simple terms?
2. **Key Intent & Stakeholders**: What does the sender want from the recipient?
3. **Important Nuances / Deadlines**: Any hidden complexities, legalistic terms, or time constraints?
4. **Suggested Action**: What is the most sensible next step?

Return your response in clean markdown.
`,

  classify: (params: PromptParams) => `
Analyze the following email and return a strictly formatted JSON object with classification and priority metadata.

Subject: ${params.subject || ''}
From: ${params.from || ''}
Body:
${params.threadText}

You MUST return a valid JSON object matching this exact schema, with NO markdown backticks, NO markdown formatting, ONLY the raw JSON string:
{
  "category": "Work" | "Primary" | "Updates" | "Promotions" | "Social",
  "priority": "URGENT" | "HIGH" | "NORMAL" | "LOW",
  "spamScore": number between 0 and 1,
  "sentiment": "Positive" | "Neutral" | "Negative" | "Urgent",
  "reasoning": "brief explanation of classification"
}
`,

  extractActions: (params: PromptParams) => `
Extract all actionable tasks, commitments, follow-ups, and deadlines mentioned in the following email thread.

Subject: ${params.subject || ''}
Thread Content:
${params.threadText}

You MUST return a valid JSON object matching this exact schema, with NO markdown backticks, NO markdown formatting, ONLY the raw JSON string:
{
  "actionItems": [
    {
      "id": "string (unique)",
      "task": "string (clear action description)",
      "assignee": "string (name or email, or 'You')",
      "dueDate": "string or null (e.g. 'Tomorrow at 5 PM', '2026-09-01', 'ASAP')",
      "confidence": number between 0.0 and 1.0,
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ]
}
`
};
