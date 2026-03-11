import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { url, apiKey, query } = await req.json();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        
        const baseUrl = url.replace(/\/$/, "");
        
        const response = await fetch(`${baseUrl}/v1/graphql`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query })
        });
        
        if (!response.ok) {
            return NextResponse.json({ error: "Failed to execute GraphQL query" }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("GraphQL proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
