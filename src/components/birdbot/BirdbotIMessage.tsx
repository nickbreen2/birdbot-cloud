"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IOSDevice } from "./IOSDevice";
import {
  MessagesHeader,
  Bubble,
  TypingBubble,
  DateSeparator,
  ReadReceipt,
  InputBar,
} from "./Messages";

type Side = "me" | "them";

type ChatItem =
  | { id: string; kind: "msg"; from: Side; text: string }
  | { id: string; kind: "typing"; from: Side };

type TailFlags = { tail: boolean; grouped: boolean };
type DisplayItem = ChatItem & TailFlags;

type ScriptStep =
  | { kind: "typing"; from: Side; delay: number; dur: number }
  | { kind: "msg"; from: Side; text: string }
  | { kind: "compose"; delay: number; text: string; dur: number }
  | { kind: "read"; delay: number }
  | { kind: "restart"; delay: number };

const SCRIPT: ScriptStep[] = [
  { kind: "typing", from: "them", delay: 600, dur: 1500 },
  { kind: "msg", from: "them", text: "morning! you've got 16 unread emails and a meeting with Sarah at 2pm" },
  { kind: "typing", from: "them", delay: 700, dur: 1400 },
  { kind: "msg", from: "them", text: "want me to draft replies and send you a prep doc?" },
  { kind: "compose", delay: 1200, text: "yes + find the q3 notes we talked about", dur: 1600 },
  { kind: "msg", from: "me", text: "yes + find the q3 notes we talked about" },
  { kind: "read", delay: 600 },
  { kind: "typing", from: "them", delay: 1100, dur: 1700 },
  { kind: "msg", from: "them", text: "✓ 3 drafts ready in Gmail" },
  { kind: "typing", from: "them", delay: 600, dur: 1300 },
  { kind: "msg", from: "them", text: "✓ prep doc saved to your calendar invite" },
  { kind: "typing", from: "them", delay: 700, dur: 1900 },
  { kind: "msg", from: "them", text: 'q3 notes — you asked me to remember "pricing lands at $29" last Tuesday' },
  { kind: "restart", delay: 5000 },
];

function useTimeline(autoplay: boolean) {
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [composing, setComposing] = useState("");
  const [showRead, setShowRead] = useState(false);
  const idRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const run = useCallback(() => {
    clearAll();
    setChat([]);
    setComposing("");
    setShowRead(false);

    const schedule = (fn: () => void, t: number) => {
      timeoutsRef.current.push(setTimeout(fn, t));
    };

    let t = 400;
    for (let i = 0; i < SCRIPT.length; i++) {
      const step = SCRIPT[i];

      if (step.kind === "typing") {
        t += step.delay;
        const showAt = t;
        const hideAt = t + step.dur;
        const tid = `typing-${i}`;
        schedule(() => {
          setChat((c) => [...c, { id: tid, kind: "typing", from: step.from }]);
        }, showAt);
        schedule(() => {
          setChat((c) => c.filter((x) => x.id !== tid));
        }, hideAt);
        t = hideAt;
      } else if (step.kind === "msg") {
        t += 50;
        const id = `msg-${++idRef.current}`;
        const step_ = step;
        schedule(() => {
          setChat((c) => [
            ...c,
            { id, kind: "msg", from: step_.from, text: step_.text },
          ]);
          if (step_.from === "me") setShowRead(false);
        }, t);
      } else if (step.kind === "compose") {
        t += step.delay;
        const startAt = t;
        const text = step.text;
        const perChar = step.dur / text.length;
        for (let k = 1; k <= text.length; k++) {
          schedule(() => setComposing(text.slice(0, k)), startAt + k * perChar);
        }
        t = startAt + step.dur;
        schedule(() => setComposing(""), t + 30);
      } else if (step.kind === "read") {
        t += step.delay;
        schedule(() => setShowRead(true), t);
      } else if (step.kind === "restart") {
        t += step.delay;
        schedule(() => run(), t);
      }
    }
  }, [clearAll]);

  useEffect(() => {
    if (autoplay) run();
    return clearAll;
  }, [autoplay, run, clearAll]);

  return { chat, composing, showRead };
}

interface MessagesScreenProps {
  agentName?: string;
  agentAvatar?: string;
  bubbleColor?: string;
  autoplay?: boolean;
}

function MessagesScreen({
  agentName = "Birdbot",
  agentAvatar = "🐦",
  bubbleColor = "#007AFF",
  autoplay = true,
}: MessagesScreenProps) {
  const { chat, composing, showRead } = useTimeline(autoplay);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, showRead]);

  const items: DisplayItem[] = useMemo(() => {
    return chat.map((c, i) => {
      const next = chat[i + 1];
      const prev = chat[i - 1];
      const from = c.from;
      const prevFrom = prev?.from ?? null;
      const grouped = prevFrom === from;
      if (c.kind === "typing") return { ...c, tail: true, grouped };
      const tail = !next || next.from !== c.from;
      return { ...c, tail, grouped };
    });
  }, [chat]);

  const lastMeIdx = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.kind === "msg" && it.from === "me") return i;
    }
    return -1;
  }, [items]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <MessagesHeader name={agentName} avatar={agentAvatar} />

      <div
        ref={scrollRef}
        className="birdbot-chat-scroll flex-1 overflow-y-auto"
        style={{ padding: "8px 0 4px" }}
      >
        <DateSeparator>
          <span style={{ fontWeight: 600 }}>Today</span>{" "}
          <span style={{ fontWeight: 400 }}>7:52 AM</span>
        </DateSeparator>

        {items.map((item, i) => (
          <React.Fragment key={item.id}>
            <div className="birdbot-bubble-anim">
              {item.kind === "typing" ? (
                <TypingBubble tail={item.tail} grouped={item.grouped} />
              ) : (
                <Bubble
                  text={item.text}
                  sent={item.from === "me"}
                  tail={item.tail}
                  grouped={item.grouped}
                  bubbleColor={bubbleColor}
                />
              )}
            </div>
            {showRead && i === lastMeIdx && <ReadReceipt label="Read" />}
          </React.Fragment>
        ))}

        <div style={{ height: 4 }} />
      </div>

      <InputBar value={composing} />
      <div style={{ height: 22, background: "#f9f9f9" }} />
    </div>
  );
}

export interface BirdbotIMessageProps extends MessagesScreenProps {
  onDarkBackground?: boolean;
}

export default function BirdbotIMessage(props: BirdbotIMessageProps) {
  return (
    <div className="flex w-full items-center justify-center">
      <IOSDevice width={402} height={874}>
        <MessagesScreen {...props} />
      </IOSDevice>
    </div>
  );
}
