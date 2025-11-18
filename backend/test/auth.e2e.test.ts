// //backend/test/auth.e2e.test.ts
// import request from "supertest";
// import app from "../src/app";
// import { prisma } from "../src/db/prisma";

// describe("auth flows", () => {
//   beforeAll(async () => {
//     // optionally clear test DB tables
//     await prisma.session.deleteMany();
//     await prisma.user.deleteMany();
//   });

//   afterAll(async () => {
//     await prisma.$disconnect();
//   });

//   it("registers, logs in, and /me works with insecure signatures", async () => {
//     process.env.ALLOW_INSECURE_SIGNATURES = "1";
//     const username = "testuser123";

//     const initRes = await request(app).post("/api/auth/register/init").send({ username });
//     expect(initRes.status).toBe(200);
//     const { regId, rpId, challenge } = initRes.body;

//     const completeRes = await request(app).post("/api/auth/register/complete").send({
//       regId,
//       username,
//       pubKey: "pub",
//       regSignature: "sig",
//       clientData: { rpId, challenge },
//     });
//     expect(completeRes.status).toBe(200);

//     const loginInit = await request(app).post("/api/auth/login/init").send({ username });
//     expect(loginInit.status).toBe(200);
//     const { loginId, challenge: loginChallenge } = loginInit.body;

//     const loginComplete = await request(app).post("/api/auth/login/complete").send({
//       loginId,
//       username,
//       signature: "sig",
//     });

//     expect(loginComplete.status).toBe(200);
//     const cookies = loginComplete.headers["set-cookie"];
//     expect(cookies).toBeDefined();

//     // call /api/me with cookie
//     const agent = request.agent(app);
//     agent.jar.setCookie(cookies[0]);
//     const me = await agent.get("/api/me");
//     expect(me.status).toBe(200);
//     expect(me.body.username).toBe(username);
//   });
// });

