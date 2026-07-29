import jwt from 'jsonwebtoken';

const token = jwt.sign({ aud: "ais-asia-southeast1-fe2325c74c", iss: "https://securetoken.google.com/ais-asia-southeast1-fe2325c74c", sub: "123" }, 'secret', { algorithm: 'HS256' });

// Wait, the error is when a Firebase token (which is RS256) is verified using jsonwebtoken with a symmetric key (HS256).
// We can just send a dummy token signed with RS256 if we have a private key, or just generate any token that has RS256 algorithm.
// Actually, I just need to find out WHICH ENDPOINT is called!
