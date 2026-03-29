FROM rabbitmq:4.2.2-management-alpine

RUN apk add --no-cache gettext && \
	rabbitmq-plugins enable --offline rabbitmq_prometheus

COPY apps/rabbitmq/render-definitions.sh /usr/local/bin/render-definitions.sh
COPY apps/rabbitmq/definitions.json.tpl /etc/rabbitmq/definitions.json.tpl
COPY apps/rabbitmq/rabbitmq.conf /etc/rabbitmq/rabbitmq.conf

RUN chmod +x /usr/local/bin/render-definitions.sh

ENTRYPOINT ["/usr/local/bin/render-definitions.sh"]
CMD ["rabbitmq-server"]