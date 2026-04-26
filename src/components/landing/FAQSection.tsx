"use client"

import { useState } from "react"
import { FAQItem } from "./FAQItem"

const FAQS = [
  {
    question: "What is BirdBot?",
    answer: "An AI assistant that lives in your messaging apps. Text it like you'd text a friend — Bird remembers what you tell it, drafts your emails, preps your meetings, and handles the busywork across your tools."
  },
  {
    question: "How is this different from ChatGPT?",
    answer: "ChatGPT lives in a tab and forgets the conversation when you close it. Bird lives in your messages and remembers across days. ChatGPT answers questions; Bird does work in your tools — drafts emails in Gmail, schedules meetings in Calendar, captures and finds the things you tell it later."
  },
  {
    question: "What can BirdBot actually do today?",
    answer: "Today, Bird captures and remembers anything you text it — thoughts, reminders, tasks, anything. Soon, Bird will take action across Gmail, Calendar, Drive, Slack, Discord, and more. We're being honest: capture is shipping first, integrations roll out as we get them right."
  },
  {
    question: "Is my data safe?",
    answer: "Yes. Your messages and memories are encrypted at rest and in transit. We never use your data to train models. You own your data — it's yours to access, export, or delete at any time."
  },
  {
    question: "Can I delete my data?",
    answer: "Yes, anytime. From your settings, you can delete individual memories or wipe everything Bird knows about you. Deletion is permanent and complete."
  },
  {
    question: "Where does BirdBot live?",
    answer: "Today, Bird lives in Telegram. Soon: iMessage and WhatsApp. You text Bird like any other contact — no separate app to open, no new interface to learn."
  },
  {
    question: "What does it cost?",
    answer: "BirdBot is free during early access. Long-term pricing isn't locked yet — early access members will get first access and the best pricing when we launch."
  },
  {
    question: "Do I need to set anything up?",
    answer: "No. Text Bird and you're started — capture works immediately. When you're ready to connect Gmail, Calendar, or other tools, you authorize each one with one click. No DevOps, no configuration files."
  },
  {
    question: "What if I just want to use it like a notes app?",
    answer: "That works. Many people use Bird as a place to dump thoughts and find them later — no integrations needed. Bird is great as a memory layer even if you never connect another tool."
  },
  {
    question: "Will Bird message me unprompted?",
    answer: "Only when you ask it to. Set a reminder for Friday, Bird messages you Friday. Tell it to follow up next week, it follows up. No marketing pings, no random check-ins. Bird messages you when there's a reason."
  },
]

const left = FAQS.slice(0, 5)
const right = FAQS.slice(5, 10)

export function FAQSection() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggle(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <section id="faq" style={{ padding: "96px 32px 112px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2
            className="font-heading font-bold text-3xl md:text-4xl"
            style={{ color: "#f1f5f9", lineHeight: 1.1, marginBottom: 12 }}
          >
            Frequently asked questions.
          </h2>
          <p
            className="font-sans"
            style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.6 }}
          >
            Real questions, real answers.
          </p>
        </div>

        {/* Two-column grid */}
        <div className="faq-grid">
          {/* Left column — items 1–5 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {left.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                expanded={expanded.has(i)}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>

          {/* Right column — items 6–10 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {right.map((faq, i) => (
              <FAQItem
                key={i + 5}
                question={faq.question}
                answer={faq.answer}
                expanded={expanded.has(i + 5)}
                onToggle={() => toggle(i + 5)}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
