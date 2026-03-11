import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    try {
        const { url, apiKey, id, className } = await req.json();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        
        const baseUrl = url.replace(/\/$/, "");
        
        const response = await fetch(`${baseUrl}/v1/objects/${className}/${id}`, {
            method: 'DELETE',
            headers
        });
        
        if (!response.ok) {
            return NextResponse.json({ error: "Failed to delete object" }, { status: response.status });
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete object proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { url, apiKey, id, className, properties } = await req.json();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        
        const baseUrl = url.replace(/\/$/, "");
        
        const response = await fetch(`${baseUrl}/v1/objects/${className}/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                class: className,
                id,
                properties
            })
        });
        
        if (!response.ok) {
            const errorMsg = await response.text();
            return NextResponse.json({ error: "Failed to update object", details: errorMsg }, { status: response.status });
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Patch object proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { url, apiKey, className, properties } = await req.json();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        
        const baseUrl = url.replace(/\/$/, "");
        
        const response = await fetch(`${baseUrl}/v1/objects`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                class: className,
                properties
            })
        });
        
        if (!response.ok) {
            const errorMsg = await response.text();
            return NextResponse.json({ error: "Failed to create object", details: errorMsg }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Create object proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
