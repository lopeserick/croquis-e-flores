import type { Metadata } from "next";
import { AboutSection } from "@/components/home/about-section";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/layout";
import { getSiteSettings } from "@/features/settings/site-settings";
import { ORDER_HREF } from "@/features/site/navigation";

export const metadata: Metadata = { title: "Sobre a artista" };

export default async function AboutPage() {
  const { about } = await getSiteSettings();
  return (
    <>
      <AboutSection about={about} variant="full" headingLevel="h1" />
      <Container className="flex justify-center pb-16 md:pb-22">
        <ButtonLink href={ORDER_HREF}>Encomende sua obra</ButtonLink>
      </Container>
    </>
  );
}
