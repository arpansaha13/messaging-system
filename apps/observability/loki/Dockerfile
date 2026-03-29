FROM grafana/loki:3.6

COPY apps/observability/loki/loki-config.yml /etc/loki/loki-config.yml
COPY apps/observability/loki/runtime-config.yml /etc/loki/runtime-config.yml

EXPOSE 3100

CMD ["-config.file=/etc/loki/loki-config.yml"]
