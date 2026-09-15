"""
HEAL LINK — Streamlit Cloud Web Application
Renders the complete AI-powered medical equipment rental platform for Streamlit Community Cloud.
"""
import os
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="HEAL LINK — AI-Powered Medical Equipment Rental & Home-Care Platform",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Minimal padding so the full UI spans edge-to-edge
st.markdown("""
<style>
    .block-container {
        padding-top: 0.2rem;
        padding-bottom: 0rem;
        padding-left: 0rem;
        padding-right: 0rem;
        max-width: 100%;
    }
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(BASE_DIR, "templates", "index.html")
CSS_PATH = os.path.join(BASE_DIR, "static", "css", "style.css")
JS_PATH = os.path.join(BASE_DIR, "static", "js", "app.js")

with open(HTML_PATH, "r", encoding="utf-8") as f:
    html_content = f.read()

with open(CSS_PATH, "r", encoding="utf-8") as f:
    css_content = f.read()

with open(JS_PATH, "r", encoding="utf-8") as f:
    js_content = f.read()

# Inline CSS and JS so Streamlit renders completely standalone
inlined_html = html_content.replace(
    '<link rel="stylesheet" href="/static/css/style.css">',
    f"<style>\n{css_content}\n</style>"
)
inlined_html = inlined_html.replace(
    '<script src="/static/js/app.js"></script>',
    f"<script>\n{js_content}\n</script>"
)

# Render full interactive application
components.html(inlined_html, height=1350, scrolling=True)
