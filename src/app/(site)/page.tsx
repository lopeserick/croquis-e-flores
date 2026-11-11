import { AboutSection } from "@/components/home/about-section";
import { CollectionsSection } from "@/components/home/collections-section";
import { CustomArtSection } from "@/components/home/custom-art-section";
import { FeaturedArtworksSection } from "@/components/home/featured-artworks-section";
import { Hero } from "@/components/home/hero";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { getFeaturedArtworks, getHomeCategories } from "@/features/catalog/queries";
import { getSiteSettings } from "@/features/settings/site-settings";
import { getPublishedTestimonials } from "@/features/testimonials/testimonials";

export default async function HomePage() {
  const [settings, categories, featured, testimonials] = await Promise.all([
    getSiteSettings(),
    getHomeCategories(),
    getFeaturedArtworks(),
    getPublishedTestimonials(),
  ]);

  return (
    <>
      <Hero hero={settings.hero} />
      <CollectionsSection categories={categories} />
      <FeaturedArtworksSection artworks={featured} />
      <HowItWorksSection />
      <CustomArtSection example={settings.editorialExample} />
      <TestimonialsSection testimonials={testimonials} />
      <AboutSection about={settings.about} />
    </>
  );
}
