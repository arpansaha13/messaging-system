FROM grafana/alloy:v1.13.1

COPY apps/observability/alloy/alloy-config.alloy /etc/alloy/alloy-config.alloy

EXPOSE 12345

ENTRYPOINT ["/bin/alloy"]
CMD ["run", "/etc/alloy/alloy-config.alloy", "--server.http.listen-addr=0.0.0.0:12345"]
