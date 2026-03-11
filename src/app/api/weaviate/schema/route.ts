import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { url, apiKey } = await req.json();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        
        const baseUrl = url.replace(/\/$/, "");
        
        const response = await fetch(`${baseUrl}/v1/schema`, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch schema" }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Schema proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
