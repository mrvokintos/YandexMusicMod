#!/usr/bin/env python3
"""Reject Linux archives that Electron cannot launch."""

import argparse
import json
import struct
import sys
import zipfile


def check_archive(archive_path: str) -> None:
    with zipfile.ZipFile(archive_path) as archive:
        names = archive.namelist()
        if any("\\" in name for name in names):
            raise ValueError("archive contains Windows path separators")

        asars = [name for name in names if name.endswith("resources/app.asar")]
        if len(asars) != 1:
            raise ValueError(f"expected one resources/app.asar, found {len(asars)}")

        asar_name = asars[0]
        root = asar_name[: -len("resources/app.asar")]
        if not any(name.startswith(root) and name.endswith(".pak") for name in names):
            raise ValueError("Electron resources are missing")

        with archive.open(asar_name) as app:
            prefix = app.read(16)
            if len(prefix) != 16:
                raise ValueError("app.asar has no valid header")
            header_size = struct.unpack_from("<I", prefix, 12)[0]
            entries = json.loads(app.read(header_size))["files"]

        package = entries.get("package.json")
        if not package:
            raise ValueError("app.asar has no package.json; it is not an Electron app")
        if "index.js" not in entries or "preload.js" not in entries:
            raise ValueError("app.asar is missing index.js or preload.js")

        ffmpeg = root + "resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg"
        if ffmpeg not in names:
            raise ValueError("Linux ffmpeg binary is missing from app.asar.unpacked")
        if root + "install-desktop.py" not in names:
            raise ValueError("Desktop shortcut installer is missing")
        if root + "resources/assets/icon.png" not in names:
            raise ValueError("Linux icon is missing")

        print(f"OK: {archive_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", help="electron-builder Linux ZIP")
    args = parser.parse_args()
    try:
        check_archive(args.archive)
    except (OSError, ValueError, KeyError, json.JSONDecodeError, zipfile.BadZipFile) as error:
        print(f"Invalid Linux release: {error}", file=sys.stderr)
        sys.exit(1)
