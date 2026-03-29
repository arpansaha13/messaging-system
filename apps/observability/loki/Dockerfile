FROM grafana/loki:3.6

COPY apps/observability/loki/loki-config.yml /etc/loki/loki-config.yml

EXPOSE 3100

CMD ["-config.file=/etc/loki/loki-config.yml"]
