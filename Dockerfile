FROM denoland/deno:alpine-1.39.0
WORKDIR /app
COPY . .
# Expose the port Cloud Run expects
EXPOSE 8080
# Run with necessary permissions for network and environment variables
CMD ["run", "--allow-net", "--allow-env", "index.ts"]
