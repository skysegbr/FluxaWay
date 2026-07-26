#!/usr/bin/env python3
"""Deprecated compatibility entry point for ``validate_fluxaway.py``."""

from pathlib import Path
from runpy import run_path


run_path(
    str(Path(__file__).with_name("validate_fluxaway.py")),
    run_name="__main__",
)
