"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            The app failed to start.
          </h1>
          <p style={{ marginTop: "0.5rem", color: "#555" }}>
            Reload the page. If it keeps happening, the reference below helps
            find it in the logs.
          </p>
          {error.digest && (
            <p style={{ marginTop: "0.5rem", color: "#555" }}>{error.digest}</p>
          )}
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: "1rem",
              padding: "0.625rem 1.125rem",
              borderRadius: "12px",
              border: 0,
              background: "#2f27ce",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
