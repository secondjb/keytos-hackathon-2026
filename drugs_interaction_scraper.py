"""
drugs_interaction_scraper.py
----------------------------
A complete scraper for Drugs.com Drug Interactions using Scrapling.
Supports two modes:
  1. Direct API / Endpoint Mode: Uses Scrapling to query the internal autocomplete API
     and fetch the interactions report directly by ID. (Fastest)
  2. Headless Browser Mode: Uses Scrapling's StealthySession to interact with the UI,
     type drug names into the search box, pick suggestions, and click 'Check Interactions'.
"""

import json
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from scrapling.fetchers import StealthyFetcher, StealthySession
from scrapling.parser import Selector


class DrugsInteractionScraper:
    BASE_URL = "https://www.drugs.com"
    AUTOCOMPLETE_API = "https://www.drugs.com/api/autocomplete/?type=interaction-basic&s="
    INTERACTION_CHECK_URL = "https://www.drugs.com/interactions-check.php?drug_list="

    @staticmethod
    def parse_report_html(html_content: str) -> Dict[str, Any]:
        """
        Parses the interactions check HTML page into structured JSON.
        """
        soup = BeautifulSoup(html_content, "html.parser")
        report = {
            "title": "",
            "drug_interactions": [],
            "duplications": [],
            "food_interactions": [],
            "disease_interactions": []
        }

        title_elem = soup.find("h1")
        if title_elem:
            report["title"] = title_elem.get_text(strip=True)

        # Iterate over accordions
        for acc in soup.find_all("div", class_="ddc-accordion-wrap"):
            # Check for header/title
            title = acc.find(["h3", "h4", "span"])
            if title:
                for svg in title.find_all("svg"):
                    svg.replace_with(" + ")
                title_text = title.get_text(separator=" ", strip=True)
                title_text = re.sub(r'\s*\+\s*', ' + ', title_text).strip()
            else:
                title_text = ""
            
            # Content
            content_elem = acc.find(class_=lambda c: c and ("content" in c or "accordion" in c))
            content_text = content_elem.get_text(separator=" ", strip=True) if content_elem else acc.get_text(separator=" ", strip=True)

            # Determine section by checking preceding H2
            prev_h2 = acc.find_previous("h2")
            section_name = prev_h2.get_text(strip=True).lower() if prev_h2 else ""

            # Classify interaction
            entry = {
                "title": title_text,
                "text": content_text
            }

            if "duplication" in section_name:
                report["duplications"].append(entry)
            elif "food" in section_name:
                report["food_interactions"].append(entry)
            elif "disease" in section_name:
                report["disease_interactions"].append(entry)
            else:
                # Main drug interactions
                # Extract severity tag (Major, Moderate, Minor)
                severity = "Unknown"
                if "major" in title_text.lower():
                    severity = "Major"
                elif "moderate" in title_text.lower():
                    severity = "Moderate"
                elif "minor" in title_text.lower():
                    severity = "Minor"

                entry["severity"] = severity
                report["drug_interactions"].append(entry)

        return report

    # -------------------------------------------------------------
    # METHOD 1: Fast Direct API + Scrapling Fetch
    # -------------------------------------------------------------
    def search_drug_api(self, drug_query: str) -> Optional[Dict[str, Any]]:
        """
        Calls drugs.com internal autocomplete API using Scrapling StealthyFetcher.
        Returns the top matching result containing ddc_id and brand_name_id.
        """
        url = f"{self.AUTOCOMPLETE_API}{drug_query.strip()}"
        res = StealthyFetcher.fetch(url, headless=True)
        if res.status != 200:
            print(f"[!] Failed to fetch autocomplete for '{drug_query}': Status {res.status}")
            return None

        try:
            data = json.loads(res.body)
            categories = data.get("categories", [])
            if categories and categories[0].get("results"):
                top_match = categories[0]["results"][0]
                return {
                    "query": drug_query,
                    "suggestion": top_match.get("suggestion"),
                    "ddc_id": top_match.get("ddc_id"),
                    "brand_name_id": top_match.get("brand_name_id", 0),
                    "code": f"{top_match.get('ddc_id')}-{top_match.get('brand_name_id', 0)}"
                }
        except Exception as e:
            print(f"[!] Error parsing autocomplete response: {e}")
        return None

    def get_interactions_by_api(self, drug_names: List[str]) -> Dict[str, Any]:
        """
        Resolves drug codes via autocomplete API, constructs the report URL,
        fetches and parses the report.
        """
        resolved_drugs = []
        for drug in drug_names:
            info = self.search_drug_api(drug)
            if info:
                resolved_drugs.append(info)
            else:
                print(f"[!] Could not resolve drug: {drug}")

        if len(resolved_drugs) < 2:
            raise ValueError("Need at least 2 valid drugs to check interactions.")

        drug_codes = ",".join([d["code"] for d in resolved_drugs])
        report_url = f"{self.INTERACTION_CHECK_URL}{drug_codes}"
        print(f"[*] Fetching report from: {report_url}")

        res = StealthyFetcher.fetch(report_url, headless=True)
        report = self.parse_report_html(res.html_content)
        report["resolved_drugs"] = resolved_drugs
        report["report_url"] = report_url
        return report

    # -------------------------------------------------------------
    # METHOD 2: Headless Browser UI Automation with Scrapling
    # -------------------------------------------------------------
    def get_interactions_by_headless_browser(self, drug_names: List[str]) -> Dict[str, Any]:
        """
        Drives a headless browser session to simulate user input, autocomplete selection,
        and button clicks on drugs.com.
        """
        report_html = ""
        final_url = ""

        with StealthySession(headless=True) as session:
            def page_action(page):
                nonlocal report_html, final_url
                for i, drug in enumerate(drug_names):
                    print(f"[{i+1}/{len(drug_names)}] Typing '{drug}' into search box...")
                    # Input selector accommodates both initial page and subsequent list page
                    input_sel = "#livesearch-interaction, #livesearch-interaction-basic"
                    page.wait_for_selector(input_sel, timeout=10000)

                    page.click(input_sel)
                    page.fill(input_sel, "")
                    page.keyboard.type(drug, delay=80)

                    # Wait for autocomplete dropdown item
                    first_result = page.locator(".ls-result a").first
                    first_result.wait_for(state="visible", timeout=10000)
                    
                    suggestion_name = first_result.inner_text().strip().split("\n")[0]
                    print(f"    Selected suggestion: '{suggestion_name}'")

                    # Click and wait for navigation
                    with page.expect_navigation():
                        first_result.click()

                # Click 'Check Interactions'
                print("[*] Clicking 'Check Interactions' button...")
                check_btn = page.locator("a[href*='interactions-check.php']").first
                check_btn.wait_for(state="visible", timeout=10000)

                with page.expect_navigation():
                    check_btn.click()

                final_url = page.url
                report_html = page.content()
                print(f"[*] Arrived at Report URL: {final_url}")

            session.fetch(f"{self.BASE_URL}/drug_interactions.html", page_action=page_action)

        report = self.parse_report_html(report_html)
        report["report_url"] = final_url
        return report


if __name__ == "__main__":
    import pprint
    scraper = DrugsInteractionScraper()

    drugs = ["aspirin", "ibuprofen"]
    print("=== Testing Method 1: Fast API Autocomplete + Report Fetch ===")
    res_api = scraper.get_interactions_by_api(drugs)
    print(f"Found {len(res_api['drug_interactions'])} drug interactions:")
    for d in res_api['drug_interactions']:
        print(f"- [{d['severity']}] {d['title']}: {d['text'][:120]}...")

    print(f"\nFound {len(res_api['duplications'])} therapeutic duplications.")
    print(f"Found {len(res_api['food_interactions'])} food/lifestyle interactions.")
    print(f"Found {len(res_api['disease_interactions'])} disease interactions.")
