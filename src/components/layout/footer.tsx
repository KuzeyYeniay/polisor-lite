import { Icons } from "@/components/icons";
import { contactInfo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Instagram, Linkedin, MessageCircle } from "lucide-react";

const navItems = [
  { href: "/lessons", label: "Dersler" },
  { href: "/news", label: "Eğitmenler" },
  { href: "/contact", label: "İletişim" },
];

const socialLinks = [
  { href: "https://www.instagram.com/poli.sor.torino/", label: "Instagram", icon: <Instagram className="h-5 w-5" /> },
  { href: `https://wa.me/${contactInfo.phone.replace(/\s/g, '')}`, label: "WhatsApp", icon: <MessageCircle className="h-5 w-5" /> },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
             <Link href="/" className="flex items-center space-x-2 mb-2">
                <Icons.logo className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">PoliSor</span>
             </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              Akademik başarı için Politecnico di Torino öğrencileri tarafından hazırlanmış en verimli ve güncel kaynaklar.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-semibold mb-4 text-center md:text-left">Hızlı Linkler</h3>
            <ul className="space-y-2 flex flex-col items-center md:items-start">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold mb-4 text-center md:text-left">Bizi Takip Edin</h3>
            <div className="flex justify-center md:justify-start space-x-2">
                {socialLinks.map((social) => (
                    <Button key={social.label} variant="outline" size="icon" asChild>
                        <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                            {social.icon}
                        </a>
                    </Button>
                ))}
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-between">
           <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} PoliSor. All Rights Reserved.
          </p>
           <p className="text-center text-sm text-muted-foreground md:text-right mt-2 md:mt-0">
             {contactInfo.address}
           </p>
        </div>
      </div>
    </footer>
  );
}
