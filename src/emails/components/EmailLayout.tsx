import * as React from "react";

type EmailLayoutProps = {
  title: string;
  previewText?: string;
  children: React.ReactNode;
};

export default function EmailLayout({ title, previewText, children }: EmailLayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        {previewText ? (
          <meta name="preview-text" content={previewText} />
        ) : null}
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#F2F4F7" }}>
        <table role="presentation" cellPadding={0} cellSpacing={0} width="100%" style={{ backgroundColor: "#F2F4F7", padding: "24px 0" }}>
          <tbody>
            <tr>
              <td>
                <table role="presentation" cellPadding={0} cellSpacing={0} width="100%" style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: 20, textAlign: "center", borderBottom: "1px solid #E5E7EB" }}>
                        <div
                          style={{
                            display: "inline-block",
                            fontWeight: 700,
                            fontSize: 20,
                            lineHeight: "28px",
                            color: "#111827",
                            fontFamily:
                              "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
                          }}
                        >
                          FlySpot
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: 24, color: "#111827", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'" }}>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: 18, textAlign: "center", color: "#6B7280", fontSize: 12, borderTop: "1px solid #E5E7EB" }}>
                        © {new Date().getFullYear()} FlySpot — Tous droits réservés
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}


