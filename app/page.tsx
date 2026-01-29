"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HeroSection } from "@/components/ui/hero-section"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import {
  Check,
  ChevronRight,
  BarChart,
  Lock,
  Users,
  Menu,
  X,
  Sun,
  Moon,
  Package,
  FileText,
  UserCircle,
  Star,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import Image from "next/image"
import { pricingApi, type PricingPlan } from "@/lib/api/pricing"

export default function Page() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [isLoadingPricing, setIsLoadingPricing] = useState(true)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        setIsLoadingPricing(true)
        const plans = await pricingApi.getActivePlans()
        // Ensure plans is always an array
        const validPlans = Array.isArray(plans) ? plans : []
        console.log('Fetched pricing plans:', validPlans.length, validPlans)
        setPricingPlans(validPlans)
      } catch (error) {
        console.error("Failed to fetch pricing plans:", error)
        // Fallback to empty array if API fails
        setPricingPlans([])
      } finally {
        setIsLoadingPricing(false)
      }
    }
    fetchPricingPlans()
  }, [])

  // Debug effect to track state changes
  useEffect(() => {
    console.log('Pricing plans state updated:', {
      isLoading: isLoadingPricing,
      plansLength: pricingPlans?.length,
      plans: pricingPlans
    })
  }, [pricingPlans, isLoadingPricing])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"}`}
      >
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Image src="/abledger-logo.png" alt="abLedger" width={32} height={32} className="size-8" />
            <span>abLedger</span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-[#28a2fd] dark:hover:text-[#28a2fd]"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-[#28a2fd] dark:hover:text-[#28a2fd]"
            >
              Testimonials
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-[#28a2fd] dark:hover:text-[#28a2fd]"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-[#28a2fd] dark:hover:text-[#28a2fd]"
            >
              FAQ
            </Link>
          </nav>
          <div className="hidden md:flex gap-4 items-center">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {mounted && theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-[#28a2fd] dark:hover:text-[#28a2fd]"
            >
              Log in
            </Link>
            <Link href="/get-started">
              <Button className="rounded-full bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#093c93] dark:to-[#28a2fd] hover:opacity-90 text-white border-0">
                Get Started
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {mounted && theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b"
          >
            <div className="container py-4 flex flex-col gap-4">
              <Link href="#features" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Features
              </Link>
              <Link href="#testimonials" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Testimonials
              </Link>
              <Link href="#pricing" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link href="#faq" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                FAQ
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Link href="/login" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Log in
                </Link>
                <Link href="/get-started">
                  <Button className="rounded-full w-full bg-gradient-to-r from-[#00A8E8] to-[#00D9FF] dark:from-[#00D9FF] dark:to-[#66E0FF] hover:opacity-90 text-white border-0">
                    Get Started
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          title="Built for African Businesses"
          subtitle={{
            regular: "Grow Your Business with ",
            gradient: "Confidence",
          }}
          description="Manage your inventory, track sales, and serve customers better—all in one powerful platform designed for African SMEs. Real-time insights help you make smart decisions and grow your business."
          ctaText="Start Free Trial"
          ctaHref="/get-started"
          bottomImage={{
            light: "/dash-card.webp",
            dark: "/dash-dark-card.webp",
          }}
          gridOptions={{
            angle: 65,
            opacity: 0.4,
            cellSize: 50,
            lightLineColor: "#4a5568",
            darkLineColor: "#2d3748",
          }}
        />

        {/* Logos Section */}
        {/* <section className="w-full py-12 border-y bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Trusted by SMEs and growing businesses worldwide
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Image
                    key={i}
                    src={`/placeholder-logo.svg`}
                    alt={`Company logo ${i}`}
                    width={120}
                    height={60}
                    className="h-8 w-auto opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                  />
                ))}
              </div>
            </div>
          </div>
        </section> */}

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
            >
              <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-3xl text-balance">
                Everything You Need to Grow Your Business
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg text-balance">
                Track your stock, manage customer orders, and generate professional invoices—all from one powerful platform that works offline and syncs when you're back online.
              </p>
            </motion.div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Package,
                  title: "Stock Management",
                  description: "Keep track of your inventory in real-time. Know what's in stock, what's running low, and manage products across multiple locations or branches.",
                },
                {
                  icon: UserCircle,
                  title: "Customer Records",
                  description: "Store customer information, track purchase history, and manage credit accounts. Build stronger relationships with your customers.",
                },
                {
                  icon: FileText,
                  title: "Sales & Invoicing",
                  description: "Create professional invoices with your business branding. Track payments, manage outstanding balances, and keep your books in order.",
                },
                {
                  icon: BarChart,
                  title: "Business Reports",
                  description: "See how your business is performing with daily, weekly, and monthly reports. Track revenue, sales trends, and top-selling products.",
                },
                {
                  icon: Users,
                  title: "Staff Management",
                  description: "Add your staff members with different access levels. Owners, admins, and staff can work together efficiently.",
                },
                {
                  icon: Lock,
                  title: "Secure & Reliable",
                  description: "Your business data is safe with us. We use secure encryption and regular backups to protect your information.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group"
                >
                  <Card className="border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur h-full transition-all duration-300 hover:shadow-lg hover:border-[#28a2fd]/30 hover:-translate-y-1">
                    <CardContent className="p-6 flex flex-col items-start gap-4">
                      <div className="rounded-lg bg-gradient-to-br from-[#093c93]/10 via-[#28a2fd]/10 to-[#28a2fd]/10 dark:from-[#093c93]/10 dark:via-[#28a2fd]/10 dark:to-[#4ab8fd]/10 p-3 transition-transform duration-300 group-hover:scale-110">
                        <feature.icon className="size-6 text-[#28a2fd] dark:text-[#28a2fd]" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground text-balance leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>

          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
            >
              <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get Started in Three Simple Steps</h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                Set up your business account, add your products and customers, and start managing your operations in minutes. No technical skills needed.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#28a2fd]/20 dark:via-[#28a2fd]/20 to-transparent -translate-y-1/2 z-0"></div>

              {[
                {
                  step: "01",
                  title: "Sign Up Your Business",
                  description: "Create your account, add your business name, logo, and colors. Set up in less than 5 minutes.",
                },
                {
                  step: "02",
                  title: "Add Your Products & Customers",
                  description: "Import your inventory and customer list. Start with what you have, add more anytime.",
                },
                {
                  step: "03",
                  title: "Start Selling & Growing",
                  description: "Create sales, generate invoices, and track your business performance from your dashboard.",
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative z-10 flex flex-col items-center text-center space-y-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#093c93] to-[#28a2fd] dark:from-[#093c93] dark:to-[#28a2fd] text-white text-xl font-bold shadow-lg shadow-[#28a2fd]/20 dark:shadow-[#28a2fd]/20">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            >
              <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                Customer Stories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Trusted by Businesses Across Africa</h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                See how abLedger is helping businesses like yours manage operations better and grow faster.
              </p>
            </motion.div>

            <div className="relative w-full">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  slidesToScroll: 1,
                }}
                className="w-full "
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {[
                  {
                    quote:
                      "Before abLedger, I was using spreadsheets and notebooks to track my inventory. Now I can see everything at a glance, and my customers love the professional invoices. It's made running my shop so much easier.",
                    author: "Amina Hassan",
                    role: "Owner, Hassan General Store, Lagos",
                    rating: 5,
                  },
                  {
                    quote:
                      "We supply building materials to contractors across Accra. abLedger helps us track which products are moving fast, manage customer credit, and generate invoices quickly. Our sales have increased 40% because we can serve customers faster.",
                    author: "Kwame Mensah",
                    role: "Manager, Mensah Building Supplies, Accra",
                    rating: 5,
                  },
                  {
                    quote:
                      "Running a wholesale business with multiple branches was challenging until we found abLedger. Now all our locations use the same system, and I can see the full picture of our business from anywhere. Game changer!",
                    author: "Fatima Ibrahim",
                    role: "Director, Ibrahim Wholesale Ltd, Kano",
                    rating: 5,
                  },
                  {
                    quote:
                      "As a small manufacturing company in Nairobi, keeping track of raw materials and finished products was always a struggle. abLedger's stock management feature has helped us reduce waste and improve our operations significantly.",
                    author: "James Ochieng",
                    role: "Production Manager, Jambo Industries, Nairobi",
                    rating: 5,
                  },
                  {
                    quote:
                      "I started using abLedger for my fashion retail business 6 months ago. The reports help me see which designs are selling best, and I can manage my inventory much better. My accountant loves how organized everything is now.",
                    author: "Blessing Okoro",
                    role: "Founder, Blessing's Boutique, Port Harcourt",
                    rating: 5,
                  },
                  {
                    quote:
                      "We run a supermarket in Cape Town with over 2000 products. abLedger makes it easy to track low stock items, manage suppliers, and see daily sales reports. The setup was simple, and the team learned to use it quickly.",
                    author: "Thabo Mthembu",
                    role: "Operations Manager, Unity Supermarket, Cape Town",
                    rating: 5,
                  },
                ].map((testimonial, i) => (
                  <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="h-full"
                    >
                      <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-all hover:shadow-lg hover:border-[#28a2fd]/30 hover:-translate-y-1 duration-300">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex mb-4">
                            {Array(testimonial.rating)
                              .fill(0)
                              .map((_, j) => (
                                <Star key={j} className="size-4 text-yellow-500 fill-yellow-500" />
                              ))}
                          </div>
                          <p className="text-base leading-relaxed mb-6 flex-grow text-muted-foreground italic">{testimonial.quote}</p>
                          <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/40">
                            <div className="size-12 rounded-full bg-gradient-to-br from-[#093c93]/20 to-[#28a2fd]/20 dark:from-[#093c93]/30 dark:to-[#28a2fd]/30 flex items-center justify-center text-foreground font-semibold text-lg border border-[#28a2fd]/20">
                              {testimonial.author.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{testimonial.author}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{testimonial.role}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:border-[#28a2fd]/50" />
                <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:border-[#28a2fd]/50" />
              </Carousel>
              {/* Mobile swipe hint */}
              <div className="md:hidden flex justify-center mt-6">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>←</span> Swipe to see more
                  <span>→</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>

          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            >
              <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Simple, Affordable Pricing</h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                Annual subscription plans designed for African businesses. Start with our 14-day free trial—no credit card required.
              </p>
            </motion.div>

            <div className="mx-auto max-w-5xl">
              {(() => {
                // Debug logging
                if (process.env.NODE_ENV === 'development') {
                  console.log('Rendering pricing section:', {
                    isLoadingPricing,
                    pricingPlansLength: pricingPlans?.length,
                    isArray: Array.isArray(pricingPlans),
                    pricingPlans
                  })
                }
                
                if (isLoadingPricing) {
                  return <div className="text-center py-12 text-muted-foreground">Loading pricing plans...</div>
                }
                
                if (!Array.isArray(pricingPlans) || pricingPlans.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      No pricing plans available.
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-2 text-xs">
                          Debug: isLoading={String(isLoadingPricing)}, plans={pricingPlans ? String(pricingPlans.length) : 'null'}
                        </div>
                      )}
                    </div>
                  )
                }
                
                return (
                  <div className="grid gap-6 lg:grid-cols-3 lg:gap-6">
                    {pricingPlans.map((plan, i) => {
                  const pricePeriod = plan.isTrial 
                    ? plan.trialDays 
                      ? `for ${plan.trialDays} days`
                      : "for 14 days"
                    : plan.billingCycle === "yearly"
                    ? "per year"
                    : "per month"
                  
                  const cta = plan.isTrial ? "Start Free Trial" : "Get Started"
                  
                  return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card
                      key={plan.id}
                      className={`relative overflow-hidden h-full transition-all duration-300 ${
                        plan.isTrial
                          ? "border-2 border-emerald-500 dark:border-emerald-400 shadow-xl shadow-emerald-500/20 dark:shadow-emerald-400/20 hover:shadow-2xl hover:shadow-emerald-500/30 bg-gradient-to-b from-emerald-50/50 dark:from-emerald-950/20 to-background"
                          : plan.isPopular
                          ? "border-2 border-[#28a2fd] dark:border-[#28a2fd] shadow-xl shadow-[#28a2fd]/20 dark:shadow-[#28a2fd]/20 hover:shadow-2xl hover:shadow-[#28a2fd]/30 scale-105"
                          : "border-border/40 shadow-md hover:shadow-lg hover:border-[#28a2fd]/30"
                      } bg-gradient-to-b from-background to-muted/10 backdrop-blur`}
                    >
                      {plan.isTrial && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-lg shadow-lg">
                          Free
                        </div>
                      )}
                      {plan.isPopular && !plan.isTrial && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#093c93] dark:to-[#28a2fd] text-white px-4 py-1.5 text-xs font-semibold rounded-bl-lg shadow-lg">
                          Most Popular
                        </div>
                      )}
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="mb-6">
                          <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                          <p className="text-muted-foreground mb-6">{plan.description || ""}</p>
                          <div className="pb-4 border-b border-border/40">
                            <div className="flex items-baseline gap-2">
                              {plan.isTrial ? (
                                <>
                                  <span className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
                                    Free
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {pricePeriod}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-5xl font-bold bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#28a2fd] dark:to-[#4ab8fd] bg-clip-text text-transparent">
                                    ₦{plan.price.toLocaleString('en-NG')}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {pricePeriod}
                                  </span>
                                </>
                              )}
                            </div>
                            {!plan.isTrial && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Billed annually • Save with yearly plan
                              </p>
                            )}
                            {plan.isTrial && (
                              <p className="text-xs text-muted-foreground mt-2">
                                No credit card required • Full access
                              </p>
                            )}
                          </div>
                        </div>
                        <ul className="space-y-3 my-6 flex-grow">
                          {plan.features.map((feature, j) => (
                            <li key={feature.id || j} className="flex items-start gap-3">
                              <Check className={`mt-0.5 size-5 flex-shrink-0 ${plan.isTrial ? "text-emerald-500 dark:text-emerald-400" : "text-[#28a2fd] dark:text-[#28a2fd]"}`} />
                              <span className="text-sm leading-relaxed">{feature.featureText}</span>
                            </li>
                          ))}
                        </ul>
                        <Link href="/get-started" className="mt-auto">
                          <Button
                            className={`w-full rounded-full transition-all duration-300 ${
                              plan.isTrial
                                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 hover:opacity-90 hover:scale-105 text-white border-0 shadow-lg"
                                : plan.isPopular
                                ? "bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#093c93] dark:to-[#28a2fd] hover:opacity-90 hover:scale-105 text-white border-0 shadow-lg"
                                : "hover:bg-[#28a2fd]/5 hover:border-[#28a2fd]/30"
                            }`}
                            variant={plan.isTrial || plan.isPopular ? "default" : "outline"}
                            size="lg"
                          >
                            {cta}
                            <ChevronRight className="ml-2 size-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                  )
                })}
                  </div>
                )
              })()}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            >
              <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                Got questions? We're here to help. If you can't find what you're looking for, reach out to our support team.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl"
            >
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">How does the 14-day free trial work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Sign up and start using abLedger right away—no credit card needed. You'll have full access to all features for 14 days. After the trial, choose a plan that fits your business, or your account will remain accessible with limited features.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">Can I change my plan later?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, absolutely! You can upgrade or downgrade your plan anytime from your account settings. Changes take effect immediately, and we'll adjust your billing accordingly.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">What payment methods do you accept?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We accept major credit and debit cards (Visa, MasterCard, Verve). We're working on adding mobile money and bank transfer options for our African customers. Contact us if you need alternative payment arrangements.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">Is my business data safe?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, your data is secure. We use industry-standard encryption to protect your information, and we perform regular backups. Your data belongs to you, and we'll never share it with third parties. You can export your data anytime.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">Can I use abLedger offline?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Currently, abLedger requires an internet connection. However, we're working on offline capabilities for mobile devices. Your data syncs automatically when you're online, so you can access it from any device, anywhere.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">Do you offer support in local languages?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Currently, our support is in English, but we're expanding our language support. Our platform interface is in English, but we're working to add more language options. If you need help, our support team is always ready to assist.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-b from-[#093c93]/5 via-[#28a2fd]/5 to-transparent dark:from-[#093c93]/10 dark:via-[#28a2fd]/10 dark:to-transparent relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(40,162,253,0.1),transparent_80%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(40,162,253,0.15),transparent_80%)]"></div>

          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-8 text-center"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl text-balance">
                Ready to Grow Your Business?
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl text-balance">
                Join hundreds of businesses across Africa already using abLedger. Start your free 14-day trial today—no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/get-started">
                  <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-[#093c93] to-[#28a2fd] dark:from-[#093c93] dark:to-[#28a2fd] hover:opacity-90 text-white border-0">
                    Start Free Trial
                    <ChevronRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="rounded-full px-8 bg-transparent border-[#28a2fd]/20 dark:border-[#28a2fd]/20 hover:bg-[#28a2fd]/5 dark:hover:bg-[#28a2fd]/5">
                    Contact Us
                    <ChevronRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-background">
        <div className="container px-4 md:px-6 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold">
                <Image src="/abledger-logo.png" alt="abLedger" width={32} height={32} className="size-8" />
                <span>abLedger</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete business management solution for African SMEs. Track inventory, manage sales, and serve customers better—all in one place.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-[#28a2fd] transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-[#28a2fd] transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-[#28a2fd] transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-[#28a2fd] transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 abLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
