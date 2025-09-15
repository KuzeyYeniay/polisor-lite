import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { news } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { NewsGenerator } from '@/components/news-generator';

export default function NewsPage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">News & Updates</h1>
        <p className="text-muted-foreground mt-2">The latest articles and announcements from PoliTo.</p>
      </div>

      <NewsGenerator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {news.map((article) => {
          const articleImage = PlaceHolderImages.find((p) => p.id === article.imageId);
          return (
            <Card key={article.id} className="overflow-hidden transition-transform hover:scale-105 hover:shadow-lg">
                {articleImage && (
                    <div className="relative h-56 w-full">
                        <Image
                            src={articleImage.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover"
                            data-ai-hint={articleImage.imageHint}
                        />
                    </div>
                )}
              <CardHeader>
                <Link href={article.link}>
                  <CardTitle className="hover:text-primary transition-colors">{article.title}</CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{article.summary}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
