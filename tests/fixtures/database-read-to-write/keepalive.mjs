const key = process.env.DATABASE_SERVICE_ROLE_KEY;

await fetch("https://example.test/rest/v1/marker", {
  method: "POST",
  headers: { Authorization: "Bearer " + key },
  body: JSON.stringify({ marker: "keepalive" }),
});

await fetch("https://example.test/rest/v1/marker", {
  method: "DELETE",
  headers: { Authorization: "Bearer " + key },
});
