import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { ServicePackage } from "@/types";
import { handleError } from "@/lib/errors";
import { setCacheHeaders, CachePresets } from "@/lib/cache";

/**
 * GET /api/service-packages
 * Get all active service packages
 * Public endpoint - no authentication required
 */
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT 
        id,
        name,
        description,
        price_monthly,
        price_annual,
        features,
        is_active,
        created_at
      FROM service_packages
      WHERE is_active = true
      ORDER BY price_monthly ASC NULLS LAST
    `;

    // Parse features JSON for each package
    const packages = result.rows.map(pkg => ({
      ...pkg,
      features: pkg.features || [],
      is_active: Boolean(pkg.is_active),
    }));

    const response = NextResponse.json({ packages });
    return setCacheHeaders(response, CachePresets.LONG);
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/service-packages',
      method: 'GET',
    });
  }
}
