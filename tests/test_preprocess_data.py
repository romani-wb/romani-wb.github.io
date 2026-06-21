from __future__ import annotations

import importlib.util
import os
import unittest
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "preprocess_data.py"
SPEC = importlib.util.spec_from_file_location("preprocess_data", SCRIPT)
assert SPEC and SPEC.loader
preprocess_data = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(preprocess_data)


class JuneWorkbookIngestionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.workbook = Path(
            os.environ.get(
                "ROMANI_WORKBOOK",
                ROOT / "roman-wb-valentin" / "2026-06-17_roman-wb.xlsx",
            )
        )
        if not cls.workbook.exists():
            raise unittest.SkipTest(f"Authoritative workbook not found: {cls.workbook}")
        cls.glossary = preprocess_data.load_glossary(cls.workbook)
        cls.references = preprocess_data.build_references(cls.workbook)
        cls.hyperlinks = preprocess_data.load_glossary_hyperlinks(cls.workbook)

    def test_glossary_schema_and_row_count(self) -> None:
        self.assertEqual(list(self.glossary.columns), list(preprocess_data.EXPECTED_GLOSSARY_COLUMNS))
        self.assertEqual(len(self.glossary), 12_525)
        self.assertEqual(
            self.glossary.attrs["dropped_empty_columns"],
            ["Unnamed: 42", "Unnamed: 43", "Unnamed: 44"],
        )

    def test_every_entry_has_an_english_meaning(self) -> None:
        english_columns = [f"ENGLISH {index:02d}" for index in range(1, 11)]
        populated = self.glossary[english_columns].apply(
            lambda row: any(preprocess_data.clean_value(value) for value in row),
            axis=1,
        )
        self.assertTrue(populated.all())

    def test_reference_tables_preserve_ambiguities_and_source_typo(self) -> None:
        self.assertEqual(set(self.references["grammar_abbreviation_variants"]), {"LOC", "MOD"})
        self.assertEqual(self.references["lexical_abbreviations"]["de"]["m."], "maskulin")
        self.assertEqual(self.references["lexical_abbreviations"]["en"]["m."], "mackuline")

    def test_paradigm_alias_matches_june_header(self) -> None:
        self.assertEqual(preprocess_data.resolve_paradigm("NME-i"), "NM-E-i")

    def test_source_hyperlinks_are_retained(self) -> None:
        self.assertEqual(len(self.hyperlinks), 4)
        self.assertEqual(sum(len(links) for links in self.hyperlinks.values()), 8)
        entries = preprocess_data.build_entries(self.glossary, self.hyperlinks)
        by_row = {entry["source"]["row"]: entry for entry in entries}
        self.assertIn(
            "source_2_int_url",
            by_row[4363]["details"]["source"],
        )


class StrictSchemaTests(unittest.TestCase):
    def test_nonempty_unexpected_column_is_rejected(self) -> None:
        data = {column: [""] for column in preprocess_data.EXPECTED_GLOSSARY_COLUMNS}
        data["Unexpected"] = ["content"]
        with self.assertRaises(ValueError):
            preprocess_data.validate_glossary_columns(pd.DataFrame(data))


if __name__ == "__main__":
    unittest.main()
