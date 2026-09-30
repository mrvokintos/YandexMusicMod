#!/usr/bin/env python3
"""Add the extracted portable build to the user's application menu."""

import os
import shutil
from pathlib import Path


def quote_exec(path: Path) -> str:
    value = str(path).replace("\\", "\\\\\\\\")
    for char in ('"', "`", "$"):
        value = value.replace(char, "\\" + char)
    return '"' + value.replace("%", "%%") + '"'


app_dir = Path(__file__).resolve().parent
executable = app_dir / "yandexmusicmod"
icon = app_dir / "resources/assets/icon.png"
if not executable.is_file() or not icon.is_file():
    raise SystemExit("Run this script from an extracted Linux ZIP")

data_home = Path(os.environ.get("XDG_DATA_HOME") or Path.home() / ".local/share")
applications = data_home / "applications"
icons = data_home / "icons/hicolor/256x256/apps"
applications.mkdir(parents=True, exist_ok=True)
icons.mkdir(parents=True, exist_ok=True)
shutil.copyfile(icon, icons / "yandex-music-liberty.png")

entry = applications / "yandex-music-liberty.desktop"
entry.write_text(
    "[Desktop Entry]\n"
    "Type=Application\n"
    "Name=Яндекс Музыка Liberty\n"
    f"Exec={quote_exec(executable)}\n"
    "Icon=yandex-music-liberty\n"
    "Terminal=false\n"
    "Categories=AudioVideo;Audio;Player;\n"
    "StartupNotify=true\n",
    encoding="utf-8",
)
entry.chmod(0o644)
print(entry)
