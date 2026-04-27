"use client";

import React from "react";

export type BubbleSide = "me" | "them";

export interface BubbleProps {
  text: string;
  sent: boolean;
  tail: boolean;
  grouped: boolean;
  bubbleColor?: string;
}

export interface TypingBubbleProps {
  tail?: boolean;
  grouped?: boolean;
}

const BUBBLE_GRAY = "#E9E9EB";
const TEXT_PRIMARY = "#000";
const TEXT_SECONDARY = "rgba(60,60,67,0.6)";
const SF =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", system-ui, sans-serif';

export function MessagesHeader({
  name = "Birdbot",
  avatar = "🐦",
}: {
  name?: string;
  avatar?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "56px 14px 10px",
        borderBottom: "0.5px solid rgba(60,60,67,0.18)",
        background: "rgba(248,248,248,0.92)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        position: "relative",
        zIndex: 5,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          width: 60,
          paddingBottom: 12,
        }}
      >
        <svg width="13" height="22" viewBox="0 0 13 22" fill="none">
          <path
            d="M11 2L2 11l9 9"
            stroke="#007AFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            color: "#007AFF",
            fontFamily: SF,
            fontSize: 17,
            letterSpacing: -0.4,
            marginLeft: 2,
          }}
        >
          4
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "#F2F2F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            lineHeight: 1,
            boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)",
          }}
        >
          {avatar}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            fontFamily: SF,
            fontSize: 11,
            color: TEXT_PRIMARY,
            letterSpacing: -0.1,
          }}
        >
          <span>{name}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          width: 60,
          paddingBottom: 12,
          paddingRight: 6,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M19.5 15.5l-3.2-1.4a1.4 1.4 0 00-1.6.3l-1 1c-2.6-1.3-4.7-3.4-6-6l1-1a1.4 1.4 0 00.3-1.6L7.6 3.6a1.4 1.4 0 00-1.6-.8l-2.9.7A1.4 1.4 0 002 4.9c.4 8.6 7.5 15.6 16 16a1.4 1.4 0 001.4-1.1l.7-2.9a1.4 1.4 0 00-.7-1.5z"
            fill="#007AFF"
          />
        </svg>
      </div>
    </div>
  );
}

export function Bubble({
  text,
  sent,
  tail,
  grouped,
  bubbleColor = "#007AFF",
}: BubbleProps) {
  const fill = sent ? bubbleColor : BUBBLE_GRAY;
  const color = sent ? "#fff" : TEXT_PRIMARY;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: sent ? "flex-end" : "flex-start",
        padding: "0 9px",
        marginTop: grouped ? 2 : 8,
      }}
    >
      <div style={{ position: "relative", maxWidth: "74%" }}>
        {tail && (
          <svg
            width="13"
            height="19"
            viewBox="0 0 13 19"
            style={{
              position: "absolute",
              bottom: -0.5,
              [sent ? "right" : "left"]: -5.5,
              transform: sent ? "scaleX(-1)" : "none",
              display: "block",
            }}
          >
            <path
              d="M12 19c-3 0-6-1-8-3-1.5-1.5-2-3-2-5 0 4 4 8 10 8z"
              fill={fill}
            />
          </svg>
        )}
        <div
          style={{
            background: fill,
            color,
            borderRadius: 18,
            padding: "8px 13px 9px",
            fontFamily: SF,
            fontSize: 16.5,
            lineHeight: "21px",
            letterSpacing: -0.2,
            wordWrap: "break-word",
            position: "relative",
            zIndex: 1,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

export function TypingBubble({ tail = true, grouped = false }: TypingBubbleProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        padding: "0 9px",
        marginTop: grouped ? 2 : 8,
      }}
    >
      <div style={{ position: "relative" }}>
        {tail && (
          <svg
            width="13"
            height="19"
            viewBox="0 0 13 19"
            style={{ position: "absolute", bottom: -0.5, left: -5.5, display: "block" }}
          >
            <path
              d="M12 19c-3 0-6-1-8-3-1.5-1.5-2-3-2-5 0 4 4 8 10 8z"
              fill={BUBBLE_GRAY}
            />
          </svg>
        )}
        <div
          style={{
            background: BUBBLE_GRAY,
            borderRadius: 18,
            padding: "11px 14px",
            display: "flex",
            gap: 4,
            alignItems: "center",
            position: "relative",
            zIndex: 1,
            minWidth: 50,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "rgba(60,60,67,0.45)",
                animation: `birdbotTypingDot 1.3s ${i * 0.18}s infinite ease-in-out`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DateSeparator({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "8px 16px 6px",
        fontFamily: SF,
        fontSize: 11,
        fontWeight: 600,
        color: TEXT_SECONDARY,
        letterSpacing: -0.1,
      }}
    >
      {children}
    </div>
  );
}

export function ReadReceipt({ label = "Delivered" }: { label?: string }) {
  return (
    <div
      style={{
        textAlign: "right",
        padding: "2px 14px 0 0",
        fontFamily: SF,
        fontSize: 11,
        color: TEXT_SECONDARY,
        letterSpacing: -0.05,
      }}
    >
      {label}
    </div>
  );
}

export function InputBar({ value = "" }: { value?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: "7px 8px 10px",
        background: "#f9f9f9",
      }}
    >
      <div
        style={{
          width: 33,
          height: 33,
          borderRadius: "50%",
          background: "#E5E5EA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15">
          <path
            d="M7.5 1.5v12M1.5 7.5h12"
            stroke="rgba(60,60,67,0.7)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 33,
          borderRadius: 18,
          border: "0.5px solid rgba(60,60,67,0.25)",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          padding: "6px 6px 6px 14px",
          fontFamily: SF,
          fontSize: 16.5,
          color: value ? TEXT_PRIMARY : "rgba(60,60,67,0.5)",
          letterSpacing: -0.2,
        }}
      >
        <div style={{ flex: 1 }}>{value || "iMessage"}</div>
        <div
          style={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect
              x="3"
              y="1"
              width="8"
              height="12"
              rx="4"
              stroke="rgba(60,60,67,0.7)"
              strokeWidth="1.4"
            />
            <path
              d="M1 9c0 3.5 2.5 6 6 6s6-2.5 6-6M7 15v3M4 18.5h6"
              stroke="rgba(60,60,67,0.7)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
