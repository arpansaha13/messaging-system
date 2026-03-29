FROM fluent/fluent-bit:4.2

COPY apps/observability/fluent-bit/fluent-bit.yaml /fluent-bit/etc/fluent-bit.yaml
COPY apps/observability/fluent-bit/parsers.conf /fluent-bit/etc/parsers.conf

EXPOSE 2020

CMD ["/fluent-bit/bin/fluent-bit", "-c", "/fluent-bit/etc/fluent-bit.yaml"]
