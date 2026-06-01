def filter_links_by_search(links: list[dict], filter_text: str) -> list[dict]:
    search_lower = filter_text.lower()
    out = []
    for link in links:
        ou = link.get("original_url")
        sc = link.get("short_code")
        desc = link.get("description")
        if (
            (ou and search_lower in ou.lower())
            or (sc and search_lower in sc.lower())
            or (desc and search_lower in desc.lower())
        ):
            out.append(link)
    return out


class TestFilterLinksBySearch:
    SAMPLE = [
        {"id": 1, "original_url": "https://Example.com/foo", "short_code": "aaa", "description": "promo"},
        {"id": 2, "original_url": "https://other.org", "short_code": "XYZ12", "description": None},
        {"id": 3, "original_url": None, "short_code": "orphan", "description": "orphan note"},
    ]

    def test_empty_search_returns_all(self):
        assert filter_links_by_search(self.SAMPLE, "") == self.SAMPLE

    def test_by_original_url_case_insensitive(self):
        r = filter_links_by_search(self.SAMPLE, "example.com")
        assert [x["id"] for x in r] == [1]

    def test_by_short_code_case_insensitive(self):
        r = filter_links_by_search(self.SAMPLE, "xyz")
        assert [x["id"] for x in r] == [2]

    def test_substring_in_path(self):
        r = filter_links_by_search(self.SAMPLE, "/foo")
        assert [x["id"] for x in r] == [1]

    def test_only_short_code_when_no_url(self):
        r = filter_links_by_search(self.SAMPLE, "orph")
        assert [x["id"] for x in r] == [3]

    def test_no_matches(self):
        assert filter_links_by_search(self.SAMPLE, "__none__") == []

    def test_empty_input_list(self):
        assert filter_links_by_search([], "x") == []

    def test_by_description(self):
        r = filter_links_by_search(self.SAMPLE, "promo")
        assert [x["id"] for x in r] == [1]

    def test_by_description_orphan_note(self):
        r = filter_links_by_search(self.SAMPLE, "orphan note")
        assert [x["id"] for x in r] == [3]
