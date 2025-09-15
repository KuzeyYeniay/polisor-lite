"use client";

import { useState } from "react";
import { generateNewsSummary } from "@/ai/flows/generate-news-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";

export function NewsGenerator() {
  const [rssUrl, setRssUrl] = useState("https://www.polito.it/rss/istituzionale");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!rssUrl) {
      toast({
        title: "Error",
        description: "Please enter an RSS feed URL.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setSummary("");
    try {
      const result = await generateNewsSummary({ rssFeedUrl: rssUrl });
      setSummary(result.summary);
      toast({
        title: "Success",
        description: result.progress,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Generation Failed",
        description: "Could not generate summary from the provided URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wand2 className="text-primary"/> AI News Summarizer</CardTitle>
        <CardDescription>
          Generate a concise summary from a Politecnico di Torino RSS feed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rss-url">RSS Feed URL</Label>
            <div className="flex items-center space-x-2">
                <Input
                    id="rss-url"
                    value={rssUrl}
                    onChange={(e) => setRssUrl(e.target.value)}
                    placeholder="https://www.polito.it/rss/..."
                />
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? "Generating..." : "Generate"}
                </Button>
            </div>
          </div>
          {summary && (
            <Card className="bg-muted p-4">
              <CardHeader className="p-0 mb-2">
                <CardTitle className="text-lg">Generated Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground">{summary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
