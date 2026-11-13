import json
import logging
import asyncio
import re
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
import uvicorn

from scrapling import Fetcher, StealthyFetcher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ScraplingServer")

BASE_URL = "https://www.drugs.com"
AUTOCOMPLETE_API = "https://www.drugs.com/api/autocomplete/?type=interaction-basic&s="
INTERACTION_CHECK_URL = "https://www.drugs.com/interactions-check.php?drug_list="

EXECUTOR = ThreadPoolExecutor(max_workers=4)

SEARCH_CACHE: Dict[str, List[Dict[str, Any]]] = {}
REPORT_CACHE: Dict[str, Dict[str, Any]] = {}

def clean_drug_string(d: str) -> (str, Optional[str]):
    """Extracts main drug name and optional parenthetical name."""
    base = re.sub(r'\(.*?\)', '', d).strip()
    base = re.sub(r'[^a-zA-Z0-9\s-]', '', base).strip()
    parens = re.findall(r'\((.*?)\)', d)
    paren = None
    if parens:
        paren = re.sub(r'[^a-zA-Z0-9\s-]', '', parens[0]).strip()
    return base, paren

def _sync_search_drugs_com(query: str) -> List[Dict[str, Any]]:
    clean = query.strip().lower()
    if len(clean) < 2:
        return []

    # If query has parentheses or noise, clean it
    base_name, paren_name = clean_drug_string(clean)
    search_terms = [clean]
    if base_name and base_name != clean:
        search_terms.insert(0, base_name)
    if paren_name and paren_name != clean and paren_name != base_name:
        search_terms.append(paren_name)

    for term in search_terms:
        if term in SEARCH_CACHE and SEARCH_CACHE[term]:
            return SEARCH_CACHE[term]

        url = f"{AUTOCOMPLETE_API}{term}"
        try:
            # Fast impersonated HTTP fetch (<300ms)
            res = None
            try:
                res = Fetcher.get(url, timeout=3)
            except Exception as fe:
                logger.debug(f"Fast Fetcher failed for '{term}': {fe}")
                res = None

            # Fallback to headless browser if fast fetch blocked or unavailable
            if not res or getattr(res, "status", 0) != 200:
                res = StealthyFetcher.fetch(url, headless=True, timeout=8000)

            if not res or getattr(res, "status", 0) != 200:
                logger.warning(f"Drugs.com search failed for '{term}': status {getattr(res, 'status', 'None')}")
                continue

            data = json.loads(res.body)
            results = []
            categories = data.get("categories", [])
            if categories and categories[0].get("results"):
                for item in categories[0]["results"]:
                    suggestion = item.get("suggestion", "").replace("+", " ")
                    ddc_id = item.get("ddc_id")
                    brand_id = item.get("brand_name_id", 0)
                    if suggestion and ddc_id is not None:
                        results.append({
                            "name": suggestion,
                            "generic_name": item.get("additional") or None,
                            "ddc_id": ddc_id,
                            "brand_name_id": brand_id,
                            "code": f"{ddc_id}-{brand_id}",
                            "source": "drugs.com",
                            "raw_url": item.get("url")
                        })
            if results:
                SEARCH_CACHE[clean] = results
                SEARCH_CACHE[term] = results
                return results
        except Exception as e:
            logger.error(f"Error fetching drugs.com autocomplete for '{term}': {e}")

    return []

def _sync_parse_report_html(html_content: str, url: str) -> Dict[str, Any]:
    soup = BeautifulSoup(html_content, "html.parser")
    report = {
        "url": url,
        "title": "Drug Interaction Report",
        "drug_interactions": [],
        "duplications": [],
        "food_interactions": [],
        "disease_interactions": [],
        "error": None
    }

    title_elem = soup.find("h1")
    if title_elem:
        report["title"] = title_elem.get_text(strip=True)

    details_items = soup.find_all(
        ["details", "div"],
        class_=lambda c: c and "ddc-accordion" in c and "ddc-accordion-wrap" not in c and "ddc-accordion-content" not in c
    )

    for item in details_items:
        prev_h2 = item.find_previous("h2")
        section_name = prev_h2.get_text(strip=True).lower() if prev_h2 else ""

        if "disease" in section_name:
            continue

        title_el = item.find(["h4", "h3"])
        summary = item.find("summary")
        target_el = title_el or summary
        if target_el:
            for svg in target_el.find_all("svg"):
                svg.replace_with(" + ")
            title_text = target_el.get_text(separator=" ", strip=True)
            title_text = re.sub(r'\s*\+\s*', ' + ', title_text).strip()
        else:
            title_text = ""
        if not title_text:
            continue

        subtitle_el = item.find(class_="ddc-accordion-subtitle")
        subtitle_text = subtitle_el.get_text(strip=True) if subtitle_el else ""

        applies_to = []
        if subtitle_text:
            cleaned_sub = re.sub(r'(?i)applies\s+to:\s*', '', subtitle_text)
            applies_to = [d.strip().lower() for d in cleaned_sub.split(',') if d.strip()]

        if " + " not in title_text and len(applies_to) >= 2:
            parts = []
            rem = title_text
            matched_all = True
            for d in applies_to:
                idx = rem.lower().find(d.lower())
                if idx != -1:
                    parts.append(rem[idx:idx + len(d)])
                    rem = rem[idx + len(d):].strip()
                else:
                    matched_all = False
                    break
            if matched_all and len(parts) == len(applies_to):
                title_text = " + ".join(parts)
            else:
                title_text = " + ".join(applies_to)

        content_elem = item.find(class_="ddc-accordion-content")
        content_text = content_elem.get_text(separator=" ", strip=True) if content_elem else item.get_text(separator=" ", strip=True)

        sr_only = item.find(class_="ddc-sr-only")
        sr_text = sr_only.get_text(strip=True).lower() if sr_only else ""
        low_full = (title_text + " " + sr_text).lower()

        severity = "Unknown"
        if "major" in low_full:
            severity = "Major"
        elif "moderate" in low_full:
            severity = "Moderate"
        elif "minor" in low_full:
            severity = "Minor"

        entry = {
            "title": title_text,
            "subtitle": subtitle_text,
            "applies_to": applies_to,
            "severity": severity,
            "text": content_text
        }

        if "duplication" in section_name:
            report["duplications"].append(entry)
        elif "food" in section_name:
            report["food_interactions"].append(entry)
        elif "drug" in section_name:
            report["drug_interactions"].append(entry)

    return report

def _sync_get_interactions(drugs_or_codes: List[str]) -> Dict[str, Any]:
    resolved_codes = []
    resolved_info = []

    default_empty_report = {
        "url": "",
        "title": "Drug Interaction Report",
        "drug_interactions": [],
        "duplications": [],
        "food_interactions": [],
        "disease_interactions": [],
        "resolved_drugs": [],
        "error": None
    }

    for item in drugs_or_codes:
        item_str = str(item).strip()
        if "-" in item_str and item_str.replace("-", "").isdigit():
            resolved_codes.append(item_str)
            resolved_info.append({"code": item_str, "name": item_str})
        else:
            search_res = _sync_search_drugs_com(item_str)
            if search_res:
                top = search_res[0]
                resolved_codes.append(top["code"])
                resolved_info.append(top)
            else:
                logger.warning(f"Could not resolve drug code for '{item_str}'")

    if len(resolved_codes) < 2:
        return {
            **default_empty_report,
            "error": f"At least 2 drugs must be resolved to evaluate interactions. Resolved: {[r.get('name') for r in resolved_info]}",
            "resolved_drugs": resolved_info
        }

    cache_key = ",".join(sorted(resolved_codes))
    if cache_key in REPORT_CACHE:
        return REPORT_CACHE[cache_key]

    report_url = f"{INTERACTION_CHECK_URL}{','.join(resolved_codes)}"
    logger.info(f"Fetching Drugs.com interaction report: {report_url}")

    res = StealthyFetcher.fetch(report_url, headless=True, timeout=12000)
    report = _sync_parse_report_html(res.html_content, report_url)
    report["resolved_drugs"] = resolved_info
    REPORT_CACHE[cache_key] = report
    return report

# --- Route Handlers ---
async def health(request: Request):
    return JSONResponse({
        "status": "ok",
        "service": "Drugs.com Scrapling Scraper API",
        "engine": "Scrapling 0.5.1 + StealthyFetcher (Patchright Chromium)"
    })

async def search_endpoint(request: Request):
    q = request.query_params.get("q", "").strip()
    if not q:
        return JSONResponse({"results": [], "count": 0})

    loop = asyncio.get_running_loop()
    results = await loop.run_in_executor(EXECUTOR, _sync_search_drugs_com, q)
    return JSONResponse({"results": results, "count": len(results)})

async def interactions_endpoint(request: Request):
    default_empty = {
        "url": "",
        "title": "Drug Interaction Report",
        "drug_interactions": [],
        "duplications": [],
        "food_interactions": [],
        "disease_interactions": [],
        "resolved_drugs": [],
        "error": "Invalid request"
    }
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(default_empty, status_code=400)

    drugs = body.get("drugs", [])
    if not isinstance(drugs, list) or len(drugs) < 2:
        default_empty["error"] = "Expected 'drugs' array with at least 2 items"
        return JSONResponse(default_empty, status_code=200)

    loop = asyncio.get_running_loop()
    report = await loop.run_in_executor(EXECUTOR, _sync_get_interactions, drugs)
    return JSONResponse(report)

routes = [
    Route("/api/scraper/health", health, methods=["GET"]),
    Route("/api/scraper/search", search_endpoint, methods=["GET"]),
    Route("/api/scraper/interactions", interactions_endpoint, methods=["POST"]),
]

middleware = [
    Middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
]

app = Starlette(debug=True, routes=routes, middleware=middleware)

if __name__ == "__main__":
    print("[*] Starting Drugs.com Scrapling Server on http://127.0.0.1:5001...")
    uvicorn.run(app, host="127.0.0.1", port=5001, log_level="info")
