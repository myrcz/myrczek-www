"""Sprawdza linki w plikach HTML strony. Tylko biblioteka standardowa Pythona."""
import glob, os, re, sys, urllib.request, urllib.error
from html.parser import HTMLParser

# Serwisy, które blokują automaty (zwracają błąd mimo że link działa) — pomijamy je.
POMIN = ("instagram.com", "facebook.com", "fonts.googleapis.com", "fonts.gstatic.com",
         "googleapis.com/calendar", "google.com/maps", "example.com")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15"

class Zbieracz(HTMLParser):
    def __init__(self):
        super().__init__(); self.linki = set()
    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k in ("href", "src") and v: self.linki.add(v.strip())

def sprawdz_zewnetrzny(url):
    for metoda in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=metoda, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status
        except urllib.error.HTTPError as e:
            if metoda == "HEAD" and e.code in (403, 405, 404, 429, 500, 501):
                continue
            return e.code
        except Exception as e:
            if metoda == "HEAD": continue
            return type(e).__name__
    return "?"

bledy = []
pliki = sorted(glob.glob("**/*.html", recursive=True))
for plik in pliki:
    z = Zbieracz(); z.feed(open(plik, encoding="utf-8").read())
    for link in sorted(z.linki):
        if link.startswith(("mailto:", "tel:", "#", "data:", "javascript:")) or "${" in link:
            continue
        if link.startswith(("http://", "https://")):
            if any(p in link for p in POMIN): continue
            wynik = sprawdz_zewnetrzny(link)
            if wynik != 200 and not (isinstance(wynik, int) and 200 <= wynik < 400):
                bledy.append(f"- `{plik}` → {link} (wynik: {wynik})")
        else:
            cel = os.path.normpath(os.path.join(os.path.dirname(plik), link.split("#")[0].split("?")[0]))
            if link.split("#")[0] and not os.path.exists(cel):
                bledy.append(f"- `{plik}` → brak pliku `{cel}`")

if bledy:
    print("Znalezione problemy z linkami:\n")
    print("\n".join(bledy))
    print("\n_Instagram, Facebook i niektóre usługi Google są pomijane, bo blokują automatyczne sprawdzanie._")
    sys.exit(1)
print("Wszystkie linki działają.")
