"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Mail, Bug } from "lucide-react";

export default function TestInvitationDebugPage() {
  const [email, setEmail] = useState("onurakdeniz@outlook.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch('/api/test-invitation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Test failed');
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-orange-600 text-white p-2 rounded-lg mr-3">
              <Bug className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Email Debug Tool
            </h1>
          </div>
          <p className="text-gray-600">Test the invitation email system</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Test Invitation Email
            </CardTitle>
            <CardDescription>
              This will test the Resend integration and email sending functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTestEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Test Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  required
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Testing..." : "Send Test Email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <p><strong>Success:</strong> {result.success ? "✅ Yes" : "❌ No"}</p>
                  <p><strong>Message:</strong> {result.message || result.error}</p>
                </div>
                
                {result.debug && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Debug Information:</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Has API Key:</strong> {result.debug.hasApiKey ? "✅ Yes" : "❌ No"}</p>
                      <p><strong>API Key Length:</strong> {result.debug.apiKeyLength} characters</p>
                      <p><strong>Base URL:</strong> {result.debug.baseUrl}</p>
                      {result.debug.errorName && <p><strong>Error Type:</strong> {result.debug.errorName}</p>}
                      {result.debug.errorStatus && <p><strong>Error Status:</strong> {result.debug.errorStatus}</p>}
                    </div>
                  </div>
                )}

                {result.result && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Resend Response:</h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>🔧 Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Check API Key:</strong>
              <p>Make sure your RESEND_API_KEY is valid and starts with "re_"</p>
            </div>
            <div>
              <strong>2. Domain Verification:</strong>
              <p>If using custom domain, verify it in Resend dashboard</p>
            </div>
            <div>
              <strong>3. Test with Resend Test Email:</strong>
              <p>Try "delivered@resend.dev" as recipient for testing</p>
            </div>
            <div>
              <strong>4. Check Spam Folder:</strong>
              <p>Emails might end up in spam/junk folder</p>
            </div>
            <div>
              <strong>5. Port Configuration:</strong>
              <p>Ensure .env.local has BETTER_AUTH_URL=http://localhost:3000</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}