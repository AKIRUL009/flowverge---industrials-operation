const jwt = require("jsonwebtoken");
const token = jwt.sign({ id: 1, email: "admin@flowverge.com", role: "Admin" }, process.env.JWT_SECRET || "flowverge-dev-secret");
fetch("http://localhost:3000/api/ai/generateContent", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
  body: JSON.stringify({ model: "gemini-3.6-flash", contents: "hello" })
}).then(r => r.json()).then(console.log).catch(console.error);
