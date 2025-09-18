import { contactInfo } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function ContactPage() {
  const info = [
    {
      icon: <Phone className="h-6 w-6 text-primary" />,
      title: 'Telefon',
      value: '+39 344 719 9398',
    },
    {
      icon: <Mail className="h-6 w-6 text-primary" />,
      title: 'Email',
      value: 'poligrup44@gmail.com',
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary" />,
      title: 'Adres',
      value: 'Torino TO,İtalya',
    },
  ];

  return (
    <div className="container py-12 md:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">İletişime Geçin</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Yardımcı olmak için buradayız. İletişim bilgilerimiz aracılığıyla bize ulaşın.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
        {info.map((item) => (
          <a
            key={item.title}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="h-full text-center hover:shadow-lg hover:border-primary transition-all">
              <CardHeader className="items-center">
                {item.icon}
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.value}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
