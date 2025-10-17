# tregu_backend/app/ai/research.py
from __future__ import annotations
import re
import time
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
from readability import Document

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; TreguBot/1.0; +https://tregu.local)"
}

class WebResearcher:
    """
    Quick + simple web researcher:
     - Searches DuckDuckGo HTML (no API key)
     - Fetches top results
     - Extracts main text with readability
     - Makes a tiny extractive summary
    """

    def search(self, query: str, k: int = 5) -> List[str]:
        url = "https://duckduckgo.com/html/"
        r = requests.post(url, data={"q": query}, headers=HEADERS, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        links = []
        for a in soup.select("a.result__a")[:k]:
            href = a.get("href")
            if href and href.startswith("http"):
                links.append(href)
        return links

    def fetch_clean(self, url: str) -> Dict[str, str]:
        try:
            res = requests.get(url, headers=HEADERS, timeout=15)
            res.raise_for_status()
            doc = Document(res.text)
            title = doc.short_title() or url
            html = doc.summary(html_partial=True)
            text = BeautifulSoup(html, "html.parser").get_text("\n")
            text = re.sub(r"\n{2,}", "\n", text).strip()
            return {"url": url, "title": title, "text": text}
        except Exception:
            return {"url": url, "title": url, "text": ""}

    def summarize(self, text: str, max_sent: int = 3) -> str:
        # crude extractive summary: pick first sentences containing top frequent terms
        if not text:
            return ""
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 0][:40]
        if len(sentences) <= max_sent:
            return " ".join(sentences)

        words = re.findall(r"[a-zA-Z]{4,}", text.lower())
        freq = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        scored = []
        for i, s in enumerate(sentences):
            score = sum(freq.get(w.lower(), 0) for w in re.findall(r"[a-zA-Z]{4,}", s))
            scored.append((score, i, s))
        scored.sort(reverse=True)
        top = sorted(scored[:max_sent], key=lambda x: x[1])
        return " ".join([t[2] for t in top])

    def research(self, query: str, k: int = 3) -> List[Dict[str, str]]:
        urls = self.search(query, k=k)
        out: List[Dict[str, str]] = []
        for u in urls:
            doc = self.fetch_clean(u)
            summary = self.summarize(doc["text"], max_sent=3)
            out.append({"url": u, "title": doc["title"], "summary": summary})
        return out
