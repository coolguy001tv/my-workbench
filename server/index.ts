import { createApp } from "./app.ts";

const PORT = Number(process.env.PORT ?? 3201);

createApp().listen(PORT, () => console.log(`workbench api on http://localhost:${PORT}`));
