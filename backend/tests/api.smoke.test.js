const request = require("supertest");
const { createServer } = require("../src/createServer");

describe("API smoke (app+backend)", () => {
  let app;

  beforeAll(() => {
    const ctx = createServer({ enableWebSocket: false });
    app = ctx.app;
  });

  test("GET /api/health returns 200", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
    });
    expect(response.body.features).toBeDefined();
  });

  test("GET /api/auth/profile without token returns 401", async () => {
    const response = await request(app).get("/api/auth/profile");

    expect(response.status).toBe(401);
    expect(String(response.body?.message || "").toLowerCase()).toContain("token");
  });

  test("GET /api/rides/active without token returns 401", async () => {
    const response = await request(app).get("/api/rides/active");

    expect(response.status).toBe(401);
    expect(String(response.body?.message || "").toLowerCase()).toContain("token");
  });

  test("GET /api/driver-location/me without token returns 401", async () => {
    const response = await request(app).get("/api/driver-location/me");

    expect(response.status).toBe(401);
    expect(String(response.body?.message || "").toLowerCase()).toContain("token");
  });

  test("GET /api/auth/profile with malformed auth scheme still returns 401", async () => {
    const response = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", "Token abc");

    expect(response.status).toBe(401);
  });
});
