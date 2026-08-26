import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Intelligent Email Assistant...');

  // Create or update demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo.user@intelligent-assistant.ai' },
    update: {},
    create: {
      email: 'demo.user@intelligent-assistant.ai',
      name: 'Alex Vance (Demo User)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      settings: {
        create: {
          defaultTone: 'Professional',
          aiProvider: 'claude',
          aiModel: 'claude-3-5-sonnet',
          autoClassify: true,
        },
      },
    },
  });

  // Clear existing mock emails for clean seed
  await prisma.emailCache.deleteMany({
    where: { userId: user.id },
  });

  // Realistic Email Threads
  const emailsData = [
    {
      gmailMessageId: 'msg-101',
      threadId: 'thread-q3-roadmap',
      subject: 'URGENT: Q3 Product Roadmap & Architecture Review Sign-off',
      from: 'Sarah Chen <sarah.chen@techcorp.io>',
      to: user.email,
      snippet: 'Hi Alex, we need your final sign-off on the distributed database migration plan by tomorrow at 4:00 PM EST...',
      bodyPlain: `Hi Alex,\n\nWe have completed the architectural evaluation for the Q3 database migration. Our primary recommendation is to proceed with the Aurora PostgreSQL cluster with multi-region read replicas.\n\nKey decisions required from your end:\n1. Confirmation of the maintenance downtime window scheduled for Saturday 2:00 AM UTC.\n2. Sign-off on the rollback strategy in document section 4.2.\n3. Approval of the updated cloud infrastructure budget (+12% due to failover nodes).\n\nPlease review the attached architecture spec and send your approval by tomorrow at 4:00 PM EST so DevOps can schedule the change window.\n\nBest regards,\nSarah Chen\nLead Cloud Architect | TechCorp`,
      bodyHtml: `<p>Hi Alex,</p><p>We have completed the architectural evaluation for the Q3 database migration. Our primary recommendation is to proceed with the Aurora PostgreSQL cluster with multi-region read replicas.</p><p><strong>Key decisions required from your end:</strong></p><ol><li>Confirmation of the maintenance downtime window scheduled for Saturday 2:00 AM UTC.</li><li>Sign-off on the rollback strategy in document section 4.2.</li><li>Approval of the updated cloud infrastructure budget (+12% due to failover nodes).</li></ol><p>Please review the attached architecture spec and send your approval by tomorrow at 4:00 PM EST so DevOps can schedule the change window.</p><p>Best regards,<br/><strong>Sarah Chen</strong><br/>Lead Cloud Architect | TechCorp</p>`,
      labels: JSON.stringify(['INBOX', 'IMPORTANT']),
      category: 'Work',
      priority: 'URGENT',
      isRead: false,
      isStarred: true,
      hasAttachments: true,
      receivedAt: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
    },
    {
      gmailMessageId: 'msg-102',
      threadId: 'thread-enterprise-contract',
      subject: 'Contract Renewal & SLA Negotiation — Apex Global',
      from: 'Marcus Sterling <m.sterling@apexglobal.com>',
      to: user.email,
      snippet: 'Thank you for the productive call yesterday. We have reviewed the Master Services Agreement (MSA) clause 8.3...',
      bodyPlain: `Alex,\n\nThank you for taking the time to meet yesterday regarding our enterprise renewal.\n\nOur legal council has reviewed the updated MSA and raised two adjustments regarding Clause 8.3 (Data Indemnification) and Clause 12.1 (99.99% Uptime Guarantee with financial credits).\n\nIf we can agree on standard enterprise indemnification caps at 2x annual contract value, we are prepared to execute the 3-year term agreement before quarter end.\n\nCould we jump on a brief 15-minute alignment call with your legal lead this Thursday at 11:00 AM PST?\n\nSincerely,\nMarcus Sterling\nVP Procurement | Apex Global`,
      bodyHtml: `<p>Alex,</p><p>Thank you for taking the time to meet yesterday regarding our enterprise renewal.</p><p>Our legal council has reviewed the updated MSA and raised two adjustments regarding <strong>Clause 8.3 (Data Indemnification)</strong> and <strong>Clause 12.1 (99.99% Uptime Guarantee with financial credits)</strong>.</p><p>If we can agree on standard enterprise indemnification caps at 2x annual contract value, we are prepared to execute the 3-year term agreement before quarter end.</p><p>Could we jump on a brief 15-minute alignment call with your legal lead this Thursday at 11:00 AM PST?</p><p>Sincerely,<br/><strong>Marcus Sterling</strong><br/>VP Procurement | Apex Global</p>`,
      labels: JSON.stringify(['INBOX']),
      category: 'Work',
      priority: 'HIGH',
      isRead: false,
      isStarred: false,
      hasAttachments: true,
      receivedAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hrs ago
    },
    {
      gmailMessageId: 'msg-103',
      threadId: 'thread-design-system-v2',
      subject: 'Figma Components & UI Polish for Intelligent Email Assistant',
      from: 'Elena Rostova <elena.design@studioforge.co>',
      to: user.email,
      snippet: 'Hey team! The high-fidelity Figma components for the 3-pane inbox, AI summary pill, and tone selector are ready...',
      bodyPlain: `Hey team!\n\nThe updated design tokens, dark mode glassmorphism styles, and mobile responsive variants are published in Figma.\n\nHighlights of this iteration:\n- Polished micro-interactions on the AI tone selector pills.\n- Subtle shimmer animation when AI workflow executions are running in the background.\n- Accessible contrast ratios on all text and priority badges.\n\nTake a look and let me know if any component needs tweaking before the developer handoff!\n\nCheers,\nElena`,
      bodyHtml: `<p>Hey team!</p><p>The updated design tokens, dark mode glassmorphism styles, and mobile responsive variants are published in Figma.</p><p><strong>Highlights of this iteration:</strong></p><ul><li>Polished micro-interactions on the AI tone selector pills.</li><li>Subtle shimmer animation when AI workflow executions are running in the background.</li><li>Accessible contrast ratios on all text and priority badges.</li></ul><p>Take a look and let me know if any component needs tweaking before the developer handoff!</p><p>Cheers,<br/><strong>Elena</strong></p>`,
      labels: JSON.stringify(['INBOX']),
      category: 'Primary',
      priority: 'NORMAL',
      isRead: true,
      isStarred: true,
      hasAttachments: false,
      receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hrs ago
    },
    {
      gmailMessageId: 'msg-104',
      threadId: 'thread-ai-weekly-digest',
      subject: 'AI Frontier Weekly: Claude 3.5 Sonnet, Agentic Orchestration & Next-Gen Workflows',
      from: 'AI Frontier Newsletter <digest@aifrontier.news>',
      to: user.email,
      snippet: 'In this issue: How modern AI applications are decoupling execution queues from LLM prompt pipelines for zero-latency UX...',
      bodyPlain: `Welcome to AI Frontier Issue #84.\n\nTop stories this week:\n1. Agentic Orchestration in Full-Stack Apps: Why asynchronous execution workers are replacing synchronous LLM calls in high-scale web apps.\n2. Structured JSON Output with Zero Hallucination: A deep dive into JSON mode prompts.\n3. The Future of Email: How intelligent copilots are reclaiming 10+ hours per week for knowledge workers.\n\nRead the full issue online at aifrontier.news/issue-84`,
      bodyHtml: `<p>Welcome to <strong>AI Frontier Issue #84</strong>.</p><p><strong>Top stories this week:</strong></p><ol><li><strong>Agentic Orchestration in Full-Stack Apps:</strong> Why asynchronous execution workers are replacing synchronous LLM calls in high-scale web apps.</li><li><strong>Structured JSON Output with Zero Hallucination:</strong> A deep dive into JSON mode prompts.</li><li><strong>The Future of Email:</strong> How intelligent copilots are reclaiming 10+ hours per week for knowledge workers.</li></ol><p><a href="https://aifrontier.news">Read the full issue online</a></p>`,
      labels: JSON.stringify(['INBOX']),
      category: 'Promotions',
      priority: 'LOW',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ];

  for (const email of emailsData) {
    await prisma.emailCache.create({
      data: {
        userId: user.id,
        ...email,
      },
    });
  }

  // Pre-seed an initial execution example
  await prisma.execution.create({
    data: {
      userId: user.id,
      workflowType: 'summarize',
      status: 'SUCCEEDED',
      durationMs: 742,
      inputRef: JSON.stringify({ threadId: 'thread-q3-roadmap', format: 'bullets' }),
      outputRef: JSON.stringify({
        summary: "Sarah Chen is requesting final sign-off on the Q3 Aurora PostgreSQL migration by tomorrow 4:00 PM EST.\nKey decisions needed: maintenance window (Sat 2 AM UTC), rollback strategy approval, and cloud budget increase (+12%).",
        keyPoints: [
          "Migration to Aurora PostgreSQL recommended with multi-region replicas",
          "Maintenance downtime scheduled for Saturday 2:00 AM UTC",
          "Requires 12% budget increase for failover infrastructure",
          "Hard deadline: Tomorrow at 4:00 PM EST"
        ],
        sentiment: "Urgent",
        timeSensitivity: "High",
        estimatedReadTime: "30s read"
      }),
      completedAt: new Date(),
    }
  });

  console.log(`✅ Seeded ${emailsData.length} emails and demo user (${user.email}) successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
