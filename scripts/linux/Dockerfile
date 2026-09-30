FROM docker.io/oven/bun:1

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash ca-certificates git python3 fakeroot dpkg rpm \
    libnss3 libgtk-3-0 libgbm1 libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
ENV BUN_INSTALL_CACHE_DIR=/tmp/bun-cache
CMD ["bash", "scripts/linux/build_in_container.sh"]
