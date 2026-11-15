FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/voice-venv
WORKDIR /app
COPY scripts/presenter-voice-requirements.txt /tmp/voice-requirements.txt
RUN /opt/voice-venv/bin/pip install --no-cache-dir -r /tmp/voice-requirements.txt
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node lib/ ./lib/
COPY --chown=node:node data/ ./data/
COPY --chown=node:node public/ ./public/
COPY --chown=node:node scripts/ ./scripts/
RUN mkdir -p /app/.runtime && chown node:node /app/.runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=10000 \
    PRESENTER_PYTHON=/opt/voice-venv/bin/python AI_ENABLED=false \
    AI_USAGE_FILE=/app/.runtime/ai-usage.json
USER node
EXPOSE 10000
CMD ["node", "server.mjs"]
