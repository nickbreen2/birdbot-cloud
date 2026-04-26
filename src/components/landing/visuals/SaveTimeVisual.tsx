export function SaveTimeVisual() {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)",
      }}
    >
      {/* Phone outer frame */}
      <div
        style={{
          width: 155,
          height: 262,
          borderRadius: 28,
          background: "#1c1c1e",
          padding: 12,
          flexShrink: 0,
        }}
      >
        {/* Screen */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 18,
            background: "#f5f5f7",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 30,
              height: 5,
              borderRadius: 3,
              background: "#1c1c1e",
            }}
          />

          {/* Message bubble wrapper */}
          <div
            style={{
              position: "absolute",
              top: 48,
              left: 8,
              right: 8,
            }}
          >
            <div style={{ position: "relative", display: "inline-block", maxWidth: "85%" }}>
              {/* Bubble */}
              <div
                style={{
                  background: "#E9E9EB",
                  color: "#000",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "8px 12px",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                ✓ inbox cleared. 8 emails handled.
              </div>

              {/* Thumbs-up tap-back */}
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  right: -4,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#E9E9EB",
                  border: "1.5px solid #f5f5f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                }}
              >
                👍
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
