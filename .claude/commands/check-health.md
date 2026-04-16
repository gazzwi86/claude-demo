---
description: Start the server, hit the health endpoint, and report status
---

1. Start the server with `node src/index.js &`
2. Wait 1 second for it to boot
3. Call `curl -s http://localhost:3000/health`
4. Report the response
5. Kill the background server process
