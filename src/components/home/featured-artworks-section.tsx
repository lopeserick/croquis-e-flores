import { ArtworkCard } from "@/components/site/artwork-card";
import { ArtworkCarousel } from "@/components/site/artwork-carousel";
import { ActionLink } from "@/components/ui/button-link";
import { Container, Eyebrow, SectionTitle } from "@/components/ui/layout";
import type { ArtworkSummary } from "@/features/catalog/types";

export function FeaturedArtworksSection({ artworks }: { artworks: ArtworkSummary[] }) {
  if (artworks.length === 0) return null;
  return (
    <section aria-labelledby="portfolio-titulo" className="bg-white py-16 md:py-22">
      <Container>
        <ArtworkCarousel
          label="Obras em destaque"
          header={
            <div>
              <Eyebrow>Portfólio</Eyebrow>
              <SectionTitle id="portfolio-titulo" className="mt-1.5">
                Obras que contam histórias
              </SectionTitle>
            </div>
          }
          headerAction={<ActionLink href="/galeria">Ver galeria completa</ActionLink>}
        >
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </ArtworkCarousel>
      </Container>
    </section>
  );
}
