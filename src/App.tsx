import { ShoppingBag, ShoppingCart, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categories = [
  {
    icon: Truck,
    title: "Free shipping",
    description: "Free standard shipping on every order over $50.",
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    description: "30-day returns, no questions asked, on every item.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    description: "Your payment details are encrypted end to end.",
  },
];

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="flex items-center justify-between px-md py-sm max-w-5xl mx-auto">
          <span className="font-semibold">Meridian & Co.</span>
          <nav className="flex items-center gap-sm">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Shop
            </a>
            <Button variant="ghost">
              Sign in
            </Button>
            <Button variant="outline" size="sm" aria-label="Cart">
              <ShoppingCart />
            </Button>
          </nav>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 items-center gap-lg px-md py-xl max-w-5xl mx-auto">
        <div className="flex flex-col items-start text-left gap-md">
          <Badge variant="secondary">New: Fall collection</Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            Everything you need, delivered fast
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Shop thousands of everyday essentials, curated for quality and
            priced to keep you coming back.
          </p>
          <div className="flex items-center gap-sm pt-sm">
            <Button size="lg">Shop now</Button>
            <Button variant="outline" size="lg">
              View collection
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-xs">
            Trusted by over 2 million shoppers worldwide
          </p>
        </div>
        <div className="flex aspect-square w-full max-w-112 items-center justify-center rounded-lg bg-secondary">
          <ShoppingBag
            className="size-24 text-muted-foreground"
            strokeWidth={1}
          />
        </div>
      </section>

      <section className="px-md py-lg grid grid-cols-1 md:grid-cols-3 gap-md max-w-5xl mx-auto">
        {categories.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <category.icon className="size-6 text-muted-foreground" />
              <CardTitle>{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">
                Learn more
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-col items-center text-center px-md py-xl gap-sm border-t border-border">
        <h2 className="text-2xl font-semibold">Ready to start shopping?</h2>
        <p className="text-muted-foreground max-w-96">
          Create an account for free shipping and order tracking.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-xs">
          <input
            type="email"
            placeholder="Email address"
            aria-label="Email address"
            className="h-10 rounded-md border border-border bg-background px-sm text-sm"
          />
          <Button size="lg">Create your account</Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="px-md py-md text-center text-sm text-muted-foreground max-w-5xl mx-auto">
          © 2026 Meridian & Co.
        </div>
      </footer>
    </div>
  );
}

export default App;
