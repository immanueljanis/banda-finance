export const dynamic = "force-dynamic";
export async function GET() { return Response.json({message:"Legacy market services are disabled. Arc demo uses direct onchain reads and fixed prices."}, {status:410}); }
