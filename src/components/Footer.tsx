import { Mic2 } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 py-12 bg-secondary/20">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
            <Mic2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">Podcraft</span>
        </div>
        <div className="flex gap-8 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Support</a>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Podcraft. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
