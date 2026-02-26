import { Mic2 } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-bg">
            <Mic2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">PodcastFix</span>
        </div>
        <div className="flex gap-8 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Support</a>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 PodcastFix.com. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
