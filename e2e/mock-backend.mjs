import { createServer } from "node:http";

const product = {
  productId: 1,
  name: "Test notebook",
  description: "Playwright cart fixture",
  categories: [],
  variants: [
    {
      variantId: 10,
      sku: "TEST-NOTEBOOK",
      price: "10.00",
      stockStatus: "IN_STOCK",
      attributes: [],
    },
  ],
};

const server = createServer((request, response) => {
  if (request.url === "/healthz") {
    response.writeHead(200).end("ok");
    return;
  }
  if (request.method === "GET" && request.url === "/api/v1/products/1") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(product));
    return;
  }
  if (request.method === "GET" && request.url === "/api/v1/cities") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify([{ cityId: 1, name: "Houston" }]));
    return;
  }
  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ code: "NOT_FOUND", message: "Not found" }));
});

server.listen(8081, "127.0.0.1");
