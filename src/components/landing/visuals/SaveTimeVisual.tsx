export function SaveTimeVisual() {
  return (
    <div
      style={{
        width: "100%",
        height: 150,
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 16,
        background:
          "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)",
      }}
    >
      {/* Phone outer frame */}
      <div
        style={{
          width: 165,
          height: 260,
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
            background: "linear-gradient(180deg, #e8f0fe 0%, #f5f5f7 30%, #ffffff 100%)",
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
            {/* Sender name */}
            <div
              style={{
                fontSize: 10,
                color: "#8E8E93",
                marginBottom: 4,
              }}
            >
              Bird
            </div>

            <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
              {/* Bubble */}
              <div
                style={{
                  background: "#E9E9EB",
                  color: "#000",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "9px 14px",
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                ✓ inbox cleared. 8 emails handled.
              </div>

              {/* Thumbs-up tap-back — main circle */}
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  right: -4,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#E9E9EB",
                  border: "1.5px solid white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                }}
              >
                👍
                {/* Secondary dot — bottom-left of main circle */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -3,
                    left: -3,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#E9E9EB",
                    border: "1.5px solid white",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
