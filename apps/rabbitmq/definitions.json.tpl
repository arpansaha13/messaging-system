{
  "users": [
    { "name": "${RABBITMQ_USER}", "password": "${RABBITMQ_PASS}", "tags": "administrator" },
    { "name": "${BACKEND_RABBITMQ_USER}", "password": "${BACKEND_RABBITMQ_PASS}", "tags": "" },
    { "name": "${SOCKET_RABBITMQ_USER}", "password": "${SOCKET_RABBITMQ_PASS}", "tags": "" },
    { "name": "${CHAT_WORKER_RABBITMQ_USER}", "password": "${CHAT_WORKER_RABBITMQ_PASS}", "tags": "" }
  ],
  "vhosts": [
    { "name": "/" }
  ],
  "permissions": [
    { "user": "${RABBITMQ_USER}", "vhost": "/", "configure": ".*", "write": ".*", "read": ".*" },
    { "user": "${BACKEND_RABBITMQ_USER}", "vhost": "/", "configure": ".*", "write": ".*", "read": ".*" },
    { "user": "${SOCKET_RABBITMQ_USER}", "vhost": "/", "configure": ".*", "write": ".*", "read": ".*" },
    { "user": "${CHAT_WORKER_RABBITMQ_USER}", "vhost": "/", "configure": ".*", "write": ".*", "read": ".*" }
  ],
  "parameters": [],
  "policies": [],
  "queues": [],
  "exchanges": [],
  "bindings": []
}
