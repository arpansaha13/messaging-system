FROM nginx:alpine

# Copy nginx configuration files
COPY apps/nginx/nginx.conf /etc/nginx/nginx.conf
COPY apps/nginx/nginx.prod.conf.template /etc/nginx/nginx.prod.conf.template

# Copy entrypoint script
COPY apps/nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
