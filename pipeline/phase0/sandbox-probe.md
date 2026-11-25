# Sandbox probe

Facts recorded on a fresh agent VM on 2026-11-24. Each item is the command and its raw output.

- `nproc`: 4
- `free -m | head -2`: Mem total 7957 MB, used 570, free 7458, shared 0, buff/cache 134, available 7386
- `df -h / | tail -1`: /dev/root 25G size, 6.6G used, 18G available, 27% used, mounted on /
- `head -2 /etc/os-release`: PRETTY_NAME="Ubuntu 26.04.1 LTS", NAME="Ubuntu"
- `node -v`: v20.20.2
- `npm -v`: 10.8.2
- `which ffmpeg ffprobe`: /usr/bin/ffmpeg, /usr/bin/ffprobe
- `ffmpeg -version` first line: ffmpeg version 8.0.1-3ubuntu2 Copyright (c) 2000-2025 the FFmpeg developers
- `ls ~/.cache/ms-playwright`: chromium-1217, chromium_headless_shell-1217, ffmpeg-1011
- `which chromium chromium-browser google-chrome`: no output, exit code 1 (none of the three is on PATH)
- `ls /opt`: CrowdStrike, pplx-browser, pplx-chromium, uv
- `cat /proc/sys/kernel/random/boot_id`: 8aac5afa-e834-4019-bcde-1d85fa6a49e4
- `python3 -c "import PIL, numpy; print(PIL.__version__, numpy.__version__)"`: 13.0.0 2.5.5
