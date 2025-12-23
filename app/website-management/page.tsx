"use client";

import {
  Eye,
  Sparkles,
  Megaphone,
  Heart,
  Star,
  Check,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  features: string[];
  popular?: boolean;
  new?: boolean;
}

const templates: WebsiteTemplate[] = [
  {
    id: "sarpanch-classic",
    name: "Sarpanch Classic",
    description:
      "Traditional and trustworthy design perfect for village head (Sarpanch) campaigns. Emphasizes community service and local development.",
    category: "Gram Panchayat",
    image: "🏛️",
    colors: {
      primary: "#4A00B1",
      secondary: "#B7CF4F",
      accent: "#FF5E39",
    },
    features: [
      "Bio Section",
      "Village Projects",
      "Contact Form",
      "Photo Gallery",
    ],
    popular: true,
  },
  {
    id: "gram-vikas",
    name: "Gram Vikas",
    description:
      "Development-focused template showcasing infrastructure projects, water supply initiatives, and road construction achievements.",
    category: "Development",
    image: "🌾",
    colors: {
      primary: "#B7CF4F",
      secondary: "#4A00B1",
      accent: "#EFE7D3",
    },
    features: [
      "Project Timeline",
      "Before/After Gallery",
      "Statistics Dashboard",
      "Testimonials",
    ],
    new: true,
  },
  {
    id: "jan-seva",
    name: "Jan Seva",
    description:
      "Service-oriented template highlighting welfare schemes, healthcare camps, and education initiatives for village residents.",
    category: "Welfare",
    image: "🤝",
    colors: {
      primary: "#FF5E39",
      secondary: "#EFE7D3",
      accent: "#4A00B1",
    },
    features: [
      "Scheme Directory",
      "Event Calendar",
      "Beneficiary Stories",
      "Help Desk",
    ],
  },
  {
    id: "yuva-shakti",
    name: "Yuva Shakti",
    description:
      "Modern and energetic design targeting youth voters with focus on employment, sports facilities, and skill development.",
    category: "Youth",
    image: "⚡",
    colors: {
      primary: "#4A00B1",
      secondary: "#FF5E39",
      accent: "#B7CF4F",
    },
    features: [
      "Video Hero",
      "Social Feed",
      "Youth Programs",
      "Registration Form",
    ],
    popular: true,
  },
  {
    id: "mahila-samman",
    name: "Mahila Samman",
    description:
      "Women empowerment focused template with self-help groups, women safety initiatives, and education programs for girls.",
    category: "Women",
    image: "👩‍🌾",
    colors: {
      primary: "#9B6DFF",
      secondary: "#FF5E39",
      accent: "#EFE7D3",
    },
    features: [
      "SHG Directory",
      "Success Stories",
      "Safety Helpline",
      "Training Programs",
    ],
  },
  {
    id: "kisan-mitra",
    name: "Kisan Mitra",
    description:
      "Agriculture-centric template for candidates focusing on farmer welfare, irrigation projects, and MSP initiatives.",
    category: "Agriculture",
    image: "🌻",
    colors: {
      primary: "#B7CF4F",
      secondary: "#EFE7D3",
      accent: "#FF5E39",
    },
    features: [
      "Mandi Prices",
      "Weather Widget",
      "Farmer Schemes",
      "Crop Advisory",
    ],
    new: true,
  },
  {
    id: "parivartan",
    name: "Parivartan",
    description:
      "Change-focused bold design for candidates promising transformation with strong vision statements and manifesto highlights.",
    category: "Reform",
    image: "🔥",
    colors: {
      primary: "#FF5E39",
      secondary: "#4A00B1",
      accent: "#B7CF4F",
    },
    features: [
      "Manifesto Cards",
      "Comparison Table",
      "Promise Tracker",
      "Volunteer Signup",
    ],
  },
  {
    id: "samruddhi",
    name: "Samruddhi",
    description:
      "Prosperity-themed elegant template focusing on economic development, business growth, and village self-reliance.",
    category: "Economy",
    image: "✨",
    colors: {
      primary: "#C9A227",
      secondary: "#4A00B1",
      accent: "#EFE7D3",
    },
    features: [
      "Economic Stats",
      "Business Directory",
      "Investment Plans",
      "Success Metrics",
    ],
  },
];

const categories = [
  "All",
  "Gram Panchayat",
  "Development",
  "Welfare",
  "Youth",
  "Women",
  "Agriculture",
  "Reform",
  "Economy",
];

export default function WebsiteManagementPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates =
    selectedCategory === "All"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-[#B7CF4F]/5">
      {/* Page Header */}
      <header className="border-b bg-card/50 sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">Templates</h1>
            <p className="text-xs text-muted-foreground">
              Choose a template to get started
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Layout className="w-3 h-3" />
            {templates.length} Templates
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B7CF4F]/15 text-[#5a7030] dark:text-[#B7CF4F] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Village Election Campaign Templates
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Build Your Winning Campaign Website
          </h2>
          <p className="text-muted-foreground text-sm">
            Professional, mobile-friendly templates for Gram Panchayat, Block,
            and District elections.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 sm:px-6 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full h-7 text-xs px-2.5",
                selectedCategory === category &&
                  "bg-gradient-to-r from-[#B7CF4F] to-[#9ab83d] text-[#2a3a15] hover:from-[#9ab83d] hover:to-[#7da02d]"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* Templates Grid */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border",
                hoveredTemplate === template.id
                  ? "border-[#B7CF4F] shadow-md shadow-[#B7CF4F]/10"
                  : "hover:border-border"
              )}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              {/* Template Preview */}
              <div
                className="h-36 relative flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${template.colors.primary}15 0%, ${template.colors.secondary}15 100%)`,
                }}
              >
                {/* Decorative Elements */}
                <div
                  className="absolute top-3 left-3 w-12 h-1.5 rounded-full opacity-60"
                  style={{ backgroundColor: template.colors.primary }}
                />
                <div
                  className="absolute top-3 right-3 w-6 h-6 rounded-md opacity-40"
                  style={{ backgroundColor: template.colors.secondary }}
                />
                <div
                  className="absolute bottom-3 left-3 right-3 h-8 rounded-md opacity-20"
                  style={{ backgroundColor: template.colors.primary }}
                />

                {/* Main Icon */}
                <div className="text-5xl z-10 transform group-hover:scale-110 transition-transform duration-300">
                  {template.image}
                </div>

                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {template.popular && (
                    <Badge className="bg-[#FF5E39] text-white text-[9px] gap-0.5 px-1.5 py-0.5">
                      <Star className="w-2.5 h-2.5" /> Popular
                    </Badge>
                  )}
                  {template.new && (
                    <Badge className="bg-[#4A00B1] text-white text-[9px] gap-0.5 px-1.5 py-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> New
                    </Badge>
                  )}
                </div>

                {/* Hover Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-300",
                    hoveredTemplate === template.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1 h-8 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1 h-8 text-xs bg-[#B7CF4F] text-[#2a3a15] hover:bg-[#9ab83d]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Use
                  </Button>
                </div>
              </div>

              <CardContent className="p-3 space-y-2">
                {/* Title & Category */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-[#5a7030] transition-colors truncate">
                      {template.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[9px] shrink-0 px-1.5 py-0"
                    >
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((feature) => (
                    <span
                      key={feature}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 2 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      +{template.features.length - 2}
                    </span>
                  )}
                </div>

                {/* Color Palette Preview */}
                <div className="flex items-center gap-1.5 pt-2 border-t">
                  <span className="text-[9px] text-muted-foreground">
                    Colors:
                  </span>
                  <div className="flex gap-0.5">
                    {Object.values(template.colors).map((color, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="px-4 sm:px-6 py-6">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h3 className="text-lg font-bold">Need a Custom Template?</h3>
            <p className="text-muted-foreground text-sm">
              Our team can create a custom template tailored to your campaign
              needs.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Megaphone className="w-3.5 h-3.5" />
                Request Custom
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-[#4A00B1] to-[#3a008d] hover:from-[#3a008d] hover:to-[#2a0069]"
              >
                <Heart className="w-3.5 h-3.5" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
