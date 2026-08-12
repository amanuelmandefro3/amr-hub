const FONT_MONO =
  "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace";
const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const COLOR = {
  ink: "#17182a",
  inkSecondary: "#3d3c4a",
  line: "#2b2d46",
  lime: "#c8f169",
  paper: "#fffdf4",
  cream: "#f4efdf",
  muted: "#8b8a94",
};

export function renderBrandedEmail(input: {
  heading: string;
  intro: string;
  ctaLabel: string;
  url: string;
  note: string;
}) {
  const { heading, intro, ctaLabel, url, note } = input;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${COLOR.cream};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.cream};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:${COLOR.paper};border:2px solid ${COLOR.ink};border-radius:4px;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:34px;height:34px;border:2px solid ${COLOR.ink};border-radius:2px;background:${COLOR.lime};color:${COLOR.ink};font-family:${FONT_MONO};font-weight:900;font-size:16px;text-align:center;vertical-align:middle;">A</td>
                    <td style="padding-left:10px;font-family:${FONT_MONO};font-weight:800;font-size:13px;letter-spacing:0.04em;color:${COLOR.ink};">AMR HUB</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 4px 32px;">
                <h1 style="margin:0 0 12px 0;font-family:${FONT_MONO};font-size:18px;font-weight:800;color:${COLOR.ink};">${heading}</h1>
                <p style="margin:0 0 22px 0;font-family:${FONT_SANS};font-size:14px;line-height:1.6;color:${COLOR.inkSecondary};">${intro}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:${COLOR.lime};border:2px solid ${COLOR.line};border-radius:3px;">
                      <a href="${url}" style="display:inline-block;padding:12px 22px;font-family:${FONT_MONO};font-size:12px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:${COLOR.ink};text-decoration:none;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${COLOR.muted};">${note}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;border-top:1px solid #e8e2cf;font-family:${FONT_SANS};font-size:11px;line-height:1.6;color:${COLOR.muted};">
                If the button above doesn't work, paste this link into your browser:<br>
                <span style="word-break:break-all;color:${COLOR.inkSecondary};">${url}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${heading}\n\n${intro}\n\n${ctaLabel}: ${url}\n\n${note}`;

  return { html, text };
}
