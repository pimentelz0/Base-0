export default function handler(req: any, res: any) {
  res.status(200).json({ status: "ok", app: "Base 0", version: "1.0.0", platform: "vercel" });
}
