FROM denoland/deno:alpine-1.39.0
WORKDIR /app
COPY . .
# Tell Google Cloud which port to use
EXPOSE 8080
# Run the script with necessary permissions
CMD ["run", "--allow-net", "--allow-env", "index.ts"]
