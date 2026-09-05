# -*- coding: utf-8 -*-
"""Back-compat wrapper — canonical generator lives in modules/watershed-map."""
from pathlib import Path
import runpy

runpy.run_path(
    str(Path(__file__).resolve().parents[1] / "modules" / "watershed-map" / "scripts" / "generate.py"),
    run_name="__main__",
)
