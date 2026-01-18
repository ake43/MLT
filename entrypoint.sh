
#!/bin/sh

# Replace placeholder with the actual environment variable provided at runtime
# This allows the client-side app to access the API key via process.env.API_KEY
if [ -n "$API_KEY" ]; then
  echo "Injecting API_KEY into index.html..."
  sed -i "s/__API_KEY_PLACEHOLDER__/$API_KEY/g" /usr/share/nginx/html/index.html
fi

exec "$@"
