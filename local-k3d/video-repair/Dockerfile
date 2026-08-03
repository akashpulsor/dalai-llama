FROM akashtripathi/creator-service:0.1.859-video-generation-trace

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc \
    && chmod 0755 /usr/local/bin/mc \
    && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/bin/sh", "-c"]
