import markdown, pathlib
md = pathlib.Path("medium-article-Cursor.md").read_text()
body = markdown.markdown(md, extensions=["extra"])
html = f"""<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>PEM Electrolyzer Stack Explained: MEA, Water Feed, Gas Evolution, Cooling, Balance of Plant</title>
<meta name="description" content="How a generic PEM electrolyzer stack works, in 34 seconds and 1,020 code-rendered frames. MEA, water feed, proton and electron paths, gas evolution, cooling, and balance of plant. No efficiency claims."/>
<link rel="canonical" href="https://mizcausevic-dev.github.io/pem-electrolyzer-stack-explainer/article-Cursor.html"/>
<meta property="og:type" content="article"/><meta property="og:title" content="A PEM Electrolyzer Stack, Explained in 34 Seconds"/>
<meta property="og:description" content="Water in. Protons across. Electrons around. Hydrogen out. The full written version of the code-driven explainer."/>
<meta property="og:image" content="https://mizcausevic-dev.github.io/pem-electrolyzer-stack-explainer/hero-Cursor.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<style>
:root{{--bg:#0B0C10;--panel:#1F2833;--text:#C5C6C7;--bone:#E8E4D8;--cyan:#66FCF1;--gold:#FFD166}}
body{{margin:0;background:var(--bg);color:var(--text);font-family:"Space Grotesk",system-ui,sans-serif;line-height:1.75}}
main{{max-width:760px;margin:0 auto;padding:32px 22px 64px}}
img{{max-width:100%;border-radius:14px;border:1px solid #2b3a52}}
h1,h2{{color:#fff;line-height:1.15}} h1{{font-size:2.4rem}} h2{{margin-top:2.2em}}
a{{color:var(--cyan)}} strong{{color:var(--bone)}} hr{{border-color:#2b3a52}}
code{{font-family:ui-monospace,monospace;color:var(--cyan)}}
.top a{{text-decoration:none;font-weight:700}}
</style></head><body><main>
<p class="top"><a href="./">← Back to the interactive explainer</a></p>
<img src="./hero-Cursor.png" alt="Sectional diagram of a PEM electrolyzer stack showing membrane, catalyst layers, electron path, and hydrogen and oxygen outlets"/>
{body}
</main></body></html>"""
pathlib.Path("public/article-Cursor.html").write_text(html)
print("wrote public/article-Cursor.html", len(html))
